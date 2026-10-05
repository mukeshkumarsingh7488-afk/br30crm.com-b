const crypto = require("crypto");

const Invitation = require("./invitation.model");
const Business = require("../businesses/business.model");
const BusinessMember = require("../business-members/business-member.model");
const Role = require("../roles/role.model");
const User = require("../users/user.model");

const ApiError = require("../../utils/ApiError");
const { transporter } = require("../../config/email");
const env = require("../../config/env");

const INVITATION_EXPIRY_DAYS = 7;
const RESEND_COOLDOWN_SECONDS = 60;

const validateObjectId = (id, fieldName = "ID") => {
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id.toString())) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

const normalizeEmail = (email) => {
  return email.toLowerCase().trim();
};

const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashInvitationToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const getInvitationExpiry = () => {
  return new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
};

const sendInvitationEmail = async ({ email, business, role, token, expiresAt }) => {
  const invitationUrl = `${env.frontendUrl}/accept-invitation?token=${encodeURIComponent(token)}`;

  const expiryText = new Date(expiresAt).toLocaleString();

  const mailOptions = {
    from: env.brevoEmail,
    to: email,
    subject: `Invitation to join ${business.name}`,
    text: [`You have been invited to join ${business.name} on BR30 CRM.`, "", `Role: ${role.name}`, "", `Accept your invitation: ${invitationUrl}`, "", `This invitation expires on: ${expiryText}`, "", "If you did not expect this invitation, you can ignore this email."].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
        <h2>You have been invited to join ${business.name}</h2>

        <p>
          You have been invited to join
          <strong>${business.name}</strong>
          on BR30 CRM.
        </p>

        <p>
          <strong>Role:</strong> ${role.name}
        </p>

        <p style="margin:30px 0;">
          <a
            href="${invitationUrl}"
            style="display:inline-block;padding:12px 22px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;"
          >
            Accept Invitation
          </a>
        </p>

        <p>
          This invitation expires on:
          <strong>${expiryText}</strong>
        </p>

        <p>
          If you did not expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const getBusiness = async (businessId) => {
  validateObjectId(businessId, "business ID");

  const business = await Business.findOne({
    _id: businessId,
    status: "ACTIVE",
  }).lean();

  if (!business) {
    throw new ApiError(404, "Active business not found.");
  }

  return business;
};

const getRoleForBusiness = async (roleId, businessId) => {
  validateObjectId(roleId, "role ID");
  validateObjectId(businessId, "business ID");

  const role = await Role.findOne({
    _id: roleId,
    isActive: true,
    $or: [
      {
        businessId,
        type: "CUSTOM",
      },
      {
        businessId: null,
        type: "SYSTEM",
      },
    ],
  }).lean();

  if (!role) {
    throw new ApiError(400, "Selected role is not available for this business.");
  }

  return role;
};

const verifyBusinessMember = async (businessId, userId) => {
  const member = await BusinessMember.findOne({
    businessId,
    userId,
    status: "ACTIVE",
  }).lean();

  return member;
};

const createInvitation = async ({ businessId, email, roleId, invitedBy }) => {
  validateObjectId(businessId, "business ID");
  validateObjectId(invitedBy, "invited by user ID");

  const normalizedEmail = normalizeEmail(email);

  const business = await getBusiness(businessId);
  const role = await getRoleForBusiness(roleId, businessId);

  const existingUser = await User.findOne({
    email: normalizedEmail,
  }).select("_id email");

  if (existingUser) {
    const existingMember = await verifyBusinessMember(businessId, existingUser._id);

    if (existingMember) {
      throw new ApiError(409, "This user is already an active member of this business.");
    }
  }

  const existingPendingInvitation = await Invitation.findOne({
    businessId,
    email: normalizedEmail,
    status: "PENDING",
  });

  if (existingPendingInvitation) {
    if (new Date(existingPendingInvitation.expiresAt).getTime() > Date.now()) {
      throw new ApiError(409, "A pending invitation already exists for this email.");
    }

    existingPendingInvitation.status = "EXPIRED";
    existingPendingInvitation.updatedBy = invitedBy;

    await existingPendingInvitation.save();
  }

  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = getInvitationExpiry();

  const invitation = await Invitation.create({
    businessId,
    email: normalizedEmail,
    roleId: role._id,
    tokenHash,
    status: "PENDING",
    expiresAt,
    invitedBy,
    createdBy: invitedBy,
    lastSentAt: new Date(),
  });

  try {
    await sendInvitationEmail({
      email: normalizedEmail,
      business,
      role,
      token,
      expiresAt,
    });
  } catch (error) {
    await Invitation.findByIdAndDelete(invitation._id);

    throw new ApiError(500, "Invitation could not be sent. Please try again.");
  }

  return Invitation.findById(invitation._id).populate("businessId", "name slug logo").populate("roleId", "name slug description type").populate("invitedBy", "name email").lean();
};

const getInvitationsByBusiness = async (businessId, { page = 1, limit = 10, status, search } = {}) => {
  validateObjectId(businessId, "business ID");

  await getBusiness(businessId);

  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {
    businessId,
  };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.email = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  const skip = (page - 1) * limit;

  const [invitations, total] = await Promise.all([Invitation.find(filter).populate("roleId", "name slug description type").populate("invitedBy", "name email").populate("acceptedBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Invitation.countDocuments(filter)]);

  return {
    invitations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getInvitationById = async (invitationId) => {
  validateObjectId(invitationId, "invitation ID");

  const invitation = await Invitation.findById(invitationId).populate("businessId", "name slug logo").populate("roleId", "name slug description type").populate("invitedBy", "name email").populate("acceptedBy", "name email").lean();

  if (!invitation) {
    throw new ApiError(404, "Invitation not found.");
  }

  if (invitation.status === "PENDING" && new Date(invitation.expiresAt).getTime() <= Date.now()) {
    await Invitation.findByIdAndUpdate(invitationId, {
      status: "EXPIRED",
    });

    invitation.status = "EXPIRED";
  }

  return invitation;
};

const acceptInvitation = async ({ token, userId }) => {
  if (!token) {
    throw new ApiError(400, "Invitation token is required.");
  }

  validateObjectId(userId, "user ID");

  const tokenHash = hashInvitationToken(token);

  const invitation = await Invitation.findOne({
    tokenHash,
  })
    .select("+tokenHash")
    .populate("businessId", "name slug status")
    .populate("roleId", "name slug description type isActive businessId");

  if (!invitation) {
    throw new ApiError(404, "Invalid invitation token.");
  }

  if (invitation.status !== "PENDING") {
    throw new ApiError(400, `Invitation is already ${invitation.status.toLowerCase()}.`);
  }

  if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
    invitation.status = "EXPIRED";
    invitation.updatedBy = userId;
    await invitation.save();

    throw new ApiError(400, "This invitation has expired.");
  }

  if (!invitation.businessId || invitation.businessId.status !== "ACTIVE") {
    throw new ApiError(400, "The invited business is no longer active.");
  }

  if (!invitation.roleId || !invitation.roleId.isActive) {
    throw new ApiError(400, "The invitation role is no longer active.");
  }

  const user = await User.findById(userId).select("_id name email status");

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "Your user account is not active.");
  }

  if (normalizeEmail(user.email) !== invitation.email) {
    throw new ApiError(403, "This invitation was sent to a different email address.");
  }

  const existingMember = await BusinessMember.findOne({
    businessId: invitation.businessId._id,
    userId: user._id,
  });

  if (existingMember) {
    if (existingMember.status === "ACTIVE") {
      throw new ApiError(409, "You are already an active member of this business.");
    }

    existingMember.roleId = invitation.roleId._id;
    existingMember.status = "ACTIVE";
    existingMember.joinedAt = new Date();
    existingMember.invitedBy = invitation.invitedBy;
    existingMember.updatedBy = user._id;

    await existingMember.save();
  } else {
    await BusinessMember.create({
      businessId: invitation.businessId._id,
      userId: user._id,
      roleId: invitation.roleId._id,
      status: "ACTIVE",
      joinedAt: new Date(),
      invitedBy: invitation.invitedBy,
      createdBy: user._id,
    });
  }

  invitation.status = "ACCEPTED";
  invitation.acceptedBy = user._id;
  invitation.acceptedAt = new Date();
  invitation.updatedBy = user._id;

  await invitation.save();

  const member = await BusinessMember.findOne({
    businessId: invitation.businessId._id,
    userId: user._id,
  })
    .populate("businessId", "name slug logo")
    .populate("roleId", "name slug description type permissions isActive")
    .lean();

  return {
    invitation: {
      id: invitation._id,
      email: invitation.email,
      status: invitation.status,
      acceptedAt: invitation.acceptedAt,
    },
    member,
  };
};

const resendInvitation = async ({ invitationId, businessId, resentBy }) => {
  validateObjectId(invitationId, "invitation ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(resentBy, "user ID");

  const invitation = await Invitation.findOne({
    _id: invitationId,
    businessId,
  })
    .select("+tokenHash")
    .populate("businessId", "name slug logo status")
    .populate("roleId", "name slug description type isActive");

  if (!invitation) {
    throw new ApiError(404, "Invitation not found.");
  }

  if (invitation.status !== "PENDING") {
    throw new ApiError(400, "Only pending invitations can be resent.");
  }

  if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
    invitation.status = "EXPIRED";
    invitation.updatedBy = resentBy;
    await invitation.save();

    throw new ApiError(400, "This invitation has expired. Please create a new invitation.");
  }

  if (invitation.lastSentAt && Date.now() - new Date(invitation.lastSentAt).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    const remaining = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - new Date(invitation.lastSentAt).getTime())) / 1000);

    throw new ApiError(429, `Please wait ${remaining} seconds before resending the invitation.`);
  }

  if (!invitation.businessId || invitation.businessId.status !== "ACTIVE") {
    throw new ApiError(400, "The invited business is no longer active.");
  }

  if (!invitation.roleId || !invitation.roleId.isActive) {
    throw new ApiError(400, "The invitation role is no longer active.");
  }

  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = getInvitationExpiry();

  invitation.tokenHash = tokenHash;
  invitation.expiresAt = expiresAt;
  invitation.lastSentAt = new Date();
  invitation.updatedBy = resentBy;

  await invitation.save();

  try {
    await sendInvitationEmail({
      email: invitation.email,
      business: invitation.businessId,
      role: invitation.roleId,
      token,
      expiresAt,
    });
  } catch (error) {
    throw new ApiError(500, "Invitation could not be resent. Please try again.");
  }

  return Invitation.findById(invitation._id).populate("businessId", "name slug logo").populate("roleId", "name slug description type").populate("invitedBy", "name email").lean();
};

const cancelInvitation = async ({ invitationId, businessId, cancelledBy }) => {
  validateObjectId(invitationId, "invitation ID");
  validateObjectId(businessId, "business ID");
  validateObjectId(cancelledBy, "user ID");

  const invitation = await Invitation.findOne({
    _id: invitationId,
    businessId,
  });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found.");
  }

  if (invitation.status !== "PENDING") {
    throw new ApiError(400, "Only pending invitations can be cancelled.");
  }

  invitation.status = "CANCELLED";
  invitation.cancelledBy = cancelledBy;
  invitation.cancelledAt = new Date();
  invitation.updatedBy = cancelledBy;

  await invitation.save();

  return Invitation.findById(invitation._id).populate("businessId", "name slug logo").populate("roleId", "name slug description type").populate("cancelledBy", "name email").lean();
};

module.exports = {
  createInvitation,
  getInvitationsByBusiness,
  getInvitationById,
  acceptInvitation,
  resendInvitation,
  cancelInvitation,
};

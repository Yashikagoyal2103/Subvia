import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/config/prisma.js";

const PASSWORD = "DemoPassword123!";
const ADMIN_EMAIL = "seed.admin@billingos.local";
const CUSTOMER_PREFIX = "seed.customer";
const ADMIN_EMAILS = [
  ADMIN_EMAIL,
  "platform.manager@billingos.local",
  "operations.admin@billingos.local",
];

const BUSINESSES = [
  {
    name: "CloudHarbor",
    taxRate: 18,
    services: [
      ["Object Storage", "Reliable cloud storage for files, backups, and shared assets."],
      ["Managed PostgreSQL", "Managed PostgreSQL databases with backups and monitoring."],
      ["Cloud Backup", "Automated backup retention for production workloads."],
      ["Content Delivery", "Global content delivery for websites and applications."],
      ["Compute Instances", "Flexible virtual compute for application workloads."],
    ],
  },
  {
    name: "MetricForge",
    taxRate: 18,
    services: [
      ["Product Analytics", "Product funnels, retention, cohorts, and conversion analytics."],
      ["Data Warehouse", "Central analytics warehouse for business and product data."],
      ["Feature Flags", "Controlled feature rollouts and release management."],
      ["Session Replay", "Understand product behavior with privacy-aware session replay."],
      ["Experimentation", "A/B testing and experiment measurement for product teams."],
    ],
  },
  {
    name: "TeamFlow",
    taxRate: 12,
    services: [
      ["Team Workspace", "Shared workspaces for distributed teams and departments."],
      ["Project Management", "Projects, milestones, tasks, and delivery tracking."],
      ["Knowledge Base", "Centralized documentation for teams and customers."],
      ["Video Meetings", "Reliable video meetings with team collaboration tools."],
      ["Team Calendar", "Shared calendars, scheduling, and availability management."],
    ],
  },
  {
    name: "SecureVault",
    taxRate: 18,
    services: [
      ["Password Manager", "Secure credential storage and controlled team sharing."],
      ["Secrets Vault", "Centralized secrets management for engineering teams."],
      ["Device Security", "Device inventory, policy management, and security controls."],
      ["Audit Logs", "Searchable security and administrative audit history."],
      ["Access Reviews", "Periodic access reviews and permission visibility."],
    ],
  },
  {
    name: "MailPilot",
    taxRate: 18,
    services: [
      ["Transactional Email", "Application email delivery with delivery monitoring."],
      ["Email Campaigns", "Campaign creation, segmentation, and delivery analytics."],
      ["Domain Verification", "Domain authentication and sender reputation tools."],
      ["Inbox Analytics", "Monitor deliverability, engagement, and mailbox health."],
      ["Template Studio", "Reusable responsive templates for product communication."],
    ],
  },
  {
    name: "LedgerDesk",
    taxRate: 5,
    services: [
      ["Invoicing", "Professional invoices, recurring billing, and payment tracking."],
      ["Expense Tracking", "Track business expenses and organize spending."],
      ["Payment Reconciliation", "Match payments with invoices and financial records."],
      ["Financial Reports", "Revenue, receivables, and financial reporting dashboards."],
      ["Client Billing", "Customer billing profiles and recurring billing management."],
    ],
  },
  {
    name: "Supportly",
    taxRate: 12,
    services: [
      ["Helpdesk", "Customer support tickets, queues, and agent workflows."],
      ["Customer Knowledge Base", "Self-service support content for customers."],
      ["Live Chat", "Real-time customer conversations and support routing."],
      ["SLA Monitoring", "Service-level targets, alerts, and support reporting."],
      ["Support Analytics", "Agent performance, response time, and resolution analytics."],
    ],
  },
  {
    name: "DevPulse",
    taxRate: 18,
    services: [
      ["Error Monitoring", "Application error tracking with actionable diagnostics."],
      ["Log Management", "Centralized application logs with search and retention."],
      ["Uptime Monitoring", "Website and API availability monitoring with alerts."],
      ["API Observability", "API latency, traffic, and reliability monitoring."],
      ["Release Tracking", "Track deployments and correlate releases with incidents."],
    ],
  },
] as const;

const PLAN_TEMPLATES = [
  { name: "Starter", multiplier: 1, description: "For individuals and small teams getting started." },
  { name: "Growth", multiplier: 2.25, description: "For growing teams that need more capacity and automation." },
  { name: "Pro", multiplier: 4.5, description: "For established teams with advanced requirements." },
  { name: "Business", multiplier: 8.5, description: "For larger organizations with higher limits and support." },
] as const;

const CUSTOMER_NAMES = [
  ["Aarav", "Sharma"], ["Aanya", "Mehta"], ["Aditya", "Kapoor"], ["Ananya", "Singh"],
  ["Arjun", "Malhotra"], ["Diya", "Verma"], ["Ishaan", "Khanna"], ["Kiara", "Bhatia"],
  ["Kabir", "Rao"], ["Meera", "Iyer"], ["Nisha", "Gupta"], ["Rohan", "Patel"],
  ["Sana", "Khan"], ["Ved", "Joshi"], ["Tara", "Nair"], ["Rahul", "Shah"],
  ["Anika", "Desai"], ["Kunal", "Sethi"], ["Priya", "Chopra"], ["Dev", "Agarwal"],
  ["Maya", "Arora"], ["Yash", "Goyal"], ["Riya", "Saxena"], ["Neil", "Mishra"],
  ["Sara", "Bansal"], ["Vikram", "Oberoi"], ["Ira", "Menon"], ["Manav", "Dutta"],
  ["Zoya", "Reddy"], ["Karan", "Suri"], ["Avni", "Bhatt"], ["Sameer", "Gill"],
  ["Simran", "Tandon"], ["Nakul", "Chawla"], ["Ishita", "Jain"], ["Ritvik", "Sood"],
] as const;

function daysAgo(days: number, hour = 10) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(10, 0, 0, 0);
  return date;
}

async function nextInvoiceNumber(date: Date) {
  const rows = await prisma.$queryRaw<Array<{ number: bigint }>>`
    SELECT nextval('invoice_number_seq') AS number
  `;
  return `INV-${date.getUTCFullYear()}-${rows[0].number.toString().padStart(6, "0")}`;
}

async function main() {
  console.log("Starting BillingOS demo seed...");

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const demoBusinessNames = BUSINESSES.map((business) => business.name);
  const existingBusinesses = await prisma.business.findMany({
    where: { name: { in: demoBusinessNames } },
    select: { id: true },
  });
  const businessIds = existingBusinesses.map((business) => business.id);

  const existingSeedUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: ADMIN_EMAILS } },
        { email: { startsWith: `${CUSTOMER_PREFIX}.` } },
      ],
    },
    select: { id: true },
  });
  const seedUserIds = existingSeedUsers.map((user) => user.id);

  if (businessIds.length > 0 || seedUserIds.length > 0) {
    console.log("Removing previous BillingOS demo data...");

    await prisma.$transaction(async (tx) => {
      if (businessIds.length > 0) {
        const endpoints = await tx.webhookEndpoint.findMany({
          where: { businessId: { in: businessIds } },
          select: { id: true },
        });
        const profiles = await tx.customerProfile.findMany({
          where: { businessId: { in: businessIds } },
          select: { id: true },
        });
        const profileIds = profiles.map((profile) => profile.id);
        const subscriptions = await tx.subscription.findMany({
          where: { customerProfileId: { in: profileIds } },
          select: { id: true },
        });
        const subscriptionIds = subscriptions.map((subscription) => subscription.id);
        const invoices = await tx.invoice.findMany({
          where: { customerProfileId: { in: profileIds } },
          select: { id: true },
        });
        const invoiceIds = invoices.map((invoice) => invoice.id);

        if (endpointIds(endpoints).length > 0) {
          await tx.webhookDelivery.deleteMany({ where: { endpointId: { in: endpointIds(endpoints) } } });
        }
        if (subscriptionIds.length > 0) {
          await tx.subscriptionEvent.deleteMany({ where: { subscriptionId: { in: subscriptionIds } } });
        }
        if (invoiceIds.length > 0) {
          await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
          await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
          await tx.creditLedger.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
          await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
        }
        if (subscriptionIds.length > 0) {
          await tx.subscription.deleteMany({ where: { id: { in: subscriptionIds } } });
        }
        if (profileIds.length > 0) {
          await tx.creditLedger.deleteMany({ where: { customerProfileId: { in: profileIds } } });
          await tx.customerProfile.deleteMany({ where: { id: { in: profileIds } } });
        }

        await tx.apiKey.deleteMany({ where: { businessId: { in: businessIds } } });
        await tx.webhookEndpoint.deleteMany({ where: { businessId: { in: businessIds } } });
        await tx.businessMember.deleteMany({ where: { businessId: { in: businessIds } } });
        await tx.service.deleteMany({ where: { businessId: { in: businessIds } } });
        await tx.business.deleteMany({ where: { id: { in: businessIds } } });
      }

      if (seedUserIds.length > 0) {
        await tx.refreshToken.deleteMany({ where: { userId: { in: seedUserIds } } });
        await tx.user.deleteMany({ where: { id: { in: seedUserIds } } });
      }
    });
  }

  const admin = await prisma.user.create({
    data: {
      firstName: "BillingOS",
      lastName: "Admin",
      email: ADMIN_EMAIL,
      passwordHash,
      accountType: "ADMIN",
    },
  });

  const businesses: Array<{ id: string; name: string; taxRate: number; services: Array<{ id: string; name: string; plans: Array<{ id: string; name: string; price: number; interval: "MONTHLY" | "YEARLY" }> }> }> = [];

  for (const [businessIndex, definition] of BUSINESSES.entries()) {
    const business = await prisma.business.create({
      data: {
        name: definition.name,
        taxRate: definition.taxRate,
        members: {
          create: { userId: admin.id, role: "BUSINESS_ADMIN" },
        },
      },
    });

    const services = [];
    for (const [serviceIndex, [name, description]] of definition.services.entries()) {
      const service = await prisma.service.create({
        data: {
          businessId: business.id,
          name,
          description,
          isActive: !(serviceIndex === 4 && businessIndex % 3 === 0),
        },
      });

      const basePrice = 700 + businessIndex * 180 + serviceIndex * 140;
      const plans = [];
      for (const [planIndex, template] of PLAN_TEMPLATES.entries()) {
        const monthly = Math.round(basePrice * template.multiplier / 100) * 100;
        const yearly = monthly * 10;
        const isYearly = planIndex === 3;
        const plan = await prisma.plan.create({
          data: {
            serviceId: service.id,
            name: template.name,
            description: template.description,
            price: isYearly ? yearly : monthly,
            currency: "INR",
            interval: isYearly ? "YEARLY" : "MONTHLY",
            isActive: !(planIndex === 0 && (serviceIndex + businessIndex) % 5 === 0),
          },
        });
        plans.push({ id: plan.id, name: plan.name, price: plan.price, interval: plan.interval });
      }
      services.push({ id: service.id, name: service.name, plans });
    }

    businesses.push({ id: business.id, name: business.name, taxRate: business.taxRate, services });
  }

  const customers = [] as Array<{ id: string; email: string; firstName: string; lastName: string }>;
  for (const [index, [firstName, lastName]] of CUSTOMER_NAMES.entries()) {
    const email = `${CUSTOMER_PREFIX}.${String(index + 1).padStart(2, "0")}@billingos.local`;
    const customer = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        accountType: "CUSTOMER",
      },
    });
    customers.push({ id: customer.id, email, firstName, lastName });
  }

  // Every demo customer belongs to every demo business so the customer portal and admin
  // customer tables have plenty of cross-business data to inspect.
  for (const customer of customers) {
    for (const business of businesses) {
      await prisma.customerProfile.create({
        data: { userId: customer.id, businessId: business.id },
      });
    }
  }

  // Add a few admin memberships so the admin business switcher has real multi-business data.
  const managers = [
    ["platform.manager@billingos.local", "Platform", "Manager"],
    ["operations.admin@billingos.local", "Operations", "Admin"],
  ] as const;
  for (const [email, firstName, lastName] of managers) {
    const manager = await prisma.user.create({
      data: { email, firstName, lastName, passwordHash, accountType: "ADMIN" },
    });
    const membershipCount = email.startsWith("platform") ? businesses.length : 4;
    for (let i = 0; i < membershipCount; i += 1) {
      const business = businesses[i];
      await prisma.businessMember.create({ data: { userId: manager.id, businessId: business.id, role: "BUSINESS_ADMIN" } });
    }
  }

  // Seed realistic subscriptions, invoices, payments, credits, and lifecycle events.
  let subscriptionCounter = 0;
  for (const [businessIndex, business] of businesses.entries()) {
    const eligibleCustomers = customers.filter((_, index) => index < 24 && ((index + businessIndex) % 2 === 0 || index < 8));

    for (const [customerIndex, customer] of eligibleCustomers.entries()) {
      const profile = await prisma.customerProfile.findUniqueOrThrow({
        where: { userId_businessId: { userId: customer.id, businessId: business.id } },
      });

      const serviceA = business.services[(customerIndex + businessIndex) % business.services.length];
      const serviceB = business.services[(customerIndex + businessIndex + 2) % business.services.length];
      const planA = serviceA.plans[customerIndex % 3];
      const planB = serviceB.plans[(customerIndex + 1) % 3];

      await createSubscriptionBundle({
        profileId: profile.id,
        business,
        plan: planA,
        createdDaysAgo: 70 - (customerIndex % 35),
        state: customerIndex % 9 === 0 ? "PERIOD_END" : "PAID",
      });
      subscriptionCounter += 1;

      if (customerIndex % 3 !== 0) {
        await createSubscriptionBundle({
          profileId: profile.id,
          business,
          plan: planB,
          createdDaysAgo: 45 - (customerIndex % 20),
          state: customerIndex % 11 === 0 ? "FAILED" : "PAID",
        });
        subscriptionCounter += 1;
      }

      if (customerIndex % 10 === 0) {
        const cancelledPlan = business.services[(customerIndex + 3) % business.services.length].plans[0];
        await createSubscriptionBundle({
          profileId: profile.id,
          business,
          plan: cancelledPlan,
          createdDaysAgo: 110,
          state: "CANCELLED",
        });
        subscriptionCounter += 1;
      }
    }

    // A few deliberately open/past-due invoices make admin/customer states useful to inspect.
    const pastDueCustomer = eligibleCustomerAt(eligibleCustomers, 1);
    if (pastDueCustomer) {
      const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { userId_businessId: { userId: pastDueCustomer.id, businessId: business.id } } });
      const plan = business.services[0].plans[2];
      await createPastDueBundle(profile.id, business, plan);
    }

    const creditCustomer = eligibleCustomerAt(eligibleCustomers, 2);
    if (creditCustomer) {
      const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { userId_businessId: { userId: creditCustomer.id, businessId: business.id } } });
      await prisma.creditLedger.createMany({
        data: [
          { customerProfileId: profile.id, amount: 1800 + businessIndex * 300, currency: "INR", type: "CREDIT", description: "Service adjustment credit" },
          { customerProfileId: profile.id, amount: 500, currency: "INR", type: "CREDIT", description: "Promotional billing credit" },
          { customerProfileId: profile.id, amount: 250, currency: "INR", type: "DEBIT", description: "Credit applied to an invoice" },
        ],
      });
    }
  }

  // Demo webhook/API-key configuration for admin screens.
  for (const business of businesses) {
    await prisma.webhookEndpoint.createMany({
      data: [
        { businessId: business.id, url: "https://example.com/webhooks/billing", secret: `whsec_${business.id.slice(0, 16)}` },
        { businessId: business.id, url: "https://example.com/webhooks/subscriptions", secret: `whsec_${business.id.slice(0, 12)}_sub` },
      ],
    });
    await prisma.apiKey.createMany({
      data: [
        { businessId: business.id, name: "Production Integration", keyHash: `seed_${business.id}_production` },
        { businessId: business.id, name: "Reporting Integration", keyHash: `seed_${business.id}_reporting` },
      ],
    });
  }

  console.log("\nBillingOS demo seed completed.\n");
  console.log(`Businesses: ${businesses.length}`);
  console.log(`Services: ${businesses.length * 5}`);
  console.log(`Plans: ${businesses.length * 5 * 4}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Subscriptions: approximately ${subscriptionCounter} + past-due records`);
  console.log(`Admin login: ${ADMIN_EMAIL} / ${PASSWORD}`);
  console.log(`Customer login: ${customers[0].email} / ${PASSWORD}`);
  console.log("All seeded passwords use the same demo password.");
}

async function createSubscriptionBundle(input: {
  profileId: string;
  business: { id: string; taxRate: number };
  plan: { id: string; name: string; price: number; interval: "MONTHLY" | "YEARLY" };
  createdDaysAgo: number;
  state: "PAID" | "FAILED" | "PERIOD_END" | "CANCELLED";
}) {
  const createdAt = daysAgo(input.createdDaysAgo);
  const periodLength = input.plan.interval === "MONTHLY" ? 30 : 365;
  const billingPeriodStart = createdAt;
  const billingPeriodEnd = new Date(createdAt);
  billingPeriodEnd.setUTCDate(billingPeriodEnd.getUTCDate() + periodLength);

  let status: "ACTIVE" | "PENDING" | "CANCELLED" = input.state === "FAILED" ? "PENDING" : input.state === "CANCELLED" ? "CANCELLED" : "ACTIVE";
  let cancelAtPeriodEnd = input.state === "PERIOD_END";
  const cancelledAt = input.state === "CANCELLED" ? daysAgo(Math.max(5, input.createdDaysAgo - 20)) : null;

  if (input.state === "CANCELLED") {
    cancelAtPeriodEnd = false;
  }

  const subscription = await prisma.subscription.create({
    data: {
      customerProfileId: input.profileId,
      planId: input.plan.id,
      status,
      currency: "INR",
      price: input.plan.price,
      billingInterval: input.plan.interval,
      billingPeriodStart,
      billingPeriodEnd,
      cancelAtPeriodEnd,
      cancelledAt,
      createdAt,
    },
  });

  const subtotal = input.plan.price;
  const taxAmount = Math.round(subtotal * input.business.taxRate / 100);
  const total = subtotal + taxAmount;
  const invoiceDate = new Date(createdAt);
  const invoiceNumber = await nextInvoiceNumber(invoiceDate);
  const invoiceStatus = input.state === "FAILED" ? "OPEN" : "PAID";
  const paidAt = invoiceStatus === "PAID" ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerProfileId: input.profileId,
      subscriptionId: subscription.id,
      status: invoiceStatus,
      currency: "INR",
      subtotal,
      taxRate: input.business.taxRate,
      taxAmount,
      total,
      issuedAt: invoiceDate,
      dueAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      paidAt,
      createdAt: invoiceDate,
      items: {
        create: {
          description: `${input.plan.name} plan subscription`,
          quantity: 1,
          unitPrice: subtotal,
          amount: subtotal,
        },
      },
    },
  });

  if (invoiceStatus === "PAID") {
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: total,
        currency: "INR",
        status: "SUCCESS",
        paymentMethod: "DEMO",
        transactionId: `seed_tx_${invoice.id}`,
        createdAt: paidAt ?? invoiceDate,
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: total,
        currency: "INR",
        status: "FAILED",
        paymentMethod: "DEMO",
        failureReason: "Simulated payment failure.",
        createdAt: new Date(invoiceDate.getTime() + 60 * 60 * 1000),
      },
    });
  }

  await prisma.subscriptionEvent.createMany({
    data: [
      { subscriptionId: subscription.id, type: "CREATED", metadata: { source: "demo-seed" }, createdAt },
      { subscriptionId: subscription.id, type: input.state === "FAILED" ? "PAYMENT_FAILED" : "PAYMENT_SUCCEEDED", metadata: { invoiceId: invoice.id, source: "demo-seed" }, createdAt: new Date(createdAt.getTime() + 60 * 60 * 1000) },
      ...(input.state === "PERIOD_END" ? [{ subscriptionId: subscription.id, type: "CANCEL_REQUESTED" as const, metadata: { mode: "PERIOD_END", source: "demo-seed" }, createdAt: new Date() }] : []),
      ...(input.state === "CANCELLED" ? [{ subscriptionId: subscription.id, type: "CANCELLED" as const, metadata: { mode: "IMMEDIATE", source: "demo-seed" }, createdAt: cancelledAt ?? new Date() }] : []),
    ],
  });
}

async function createPastDueBundle(profileId: string, business: { id: string; taxRate: number }, plan: { id: string; name: string; price: number; interval: "MONTHLY" | "YEARLY" }) {
  const periodStart = new Date("2026-08-01T10:00:00Z");
  const periodEnd = new Date("2026-09-01T10:00:00Z");
  const subscription = await prisma.subscription.create({
    data: {
      customerProfileId: profileId,
      planId: plan.id,
      status: "PAST_DUE",
      currency: "INR",
      price: plan.price,
      billingInterval: plan.interval,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      createdAt: periodStart,
    },
  });
  const subtotal = plan.price;
  const taxAmount = Math.round(subtotal * business.taxRate / 100);
  const invoiceNumber = await nextInvoiceNumber(periodEnd);
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerProfileId: profileId,
      subscriptionId: subscription.id,
      status: "OPEN",
      currency: "INR",
      subtotal,
      taxRate: business.taxRate,
      taxAmount,
      total: subtotal + taxAmount,
      issuedAt: periodEnd,
      dueAt: daysFromNow(-5),
      createdAt: periodEnd,
      items: { create: { description: `${plan.name} renewal`, quantity: 1, unitPrice: subtotal, amount: subtotal } },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: invoice.total,
      currency: "INR",
      status: "FAILED",
      paymentMethod: "DEMO",
      failureReason: "Renewal payment failed during demo seed.",
      createdAt: daysFromNow(-4),
    },
  });
  await prisma.subscriptionEvent.createMany({
    data: [
      { subscriptionId: subscription.id, type: "CREATED", metadata: { source: "demo-seed" }, createdAt: periodStart },
      { subscriptionId: subscription.id, type: "PAYMENT_FAILED", metadata: { invoiceId: invoice.id, source: "demo-seed" }, createdAt: daysFromNow(-4) },
    ],
  });
}

function eligibleCustomerAt<T>(customers: T[], index: number) {
  return customers[index];
}

function endpointIds(endpoints: Array<{ id: string }>) {
  return endpoints.map((endpoint) => endpoint.id);
}

main()
  .catch((error) => {
    console.error("BillingOS demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from "../../config/prisma.js";
import type { CatalogQuery } from "./catalog.schema.js";

export async function getCustomerCatalog(
  query: CatalogQuery
) {
  const search = query.search?.toLowerCase();

  const businesses = await prisma.business.findMany({
    where: {
      ...(query.businessId
        ? {
            id: query.businessId,
          }
        : {}),

      services: {
        some: {
          isActive: true,
          plans: {
            some: {
              isActive: true,
              ...(query.currency
                ? {
                    currency: query.currency,
                  }
                : {}),
              ...(query.interval
                ? {
                    interval: query.interval,
                  }
                : {}),
            },
          },
        },
      },
    },

    select: {
      id: true,
      name: true,

      services: {
        where: {
          isActive: true,
          plans: {
            some: {
              isActive: true,
              ...(query.currency
                ? {
                    currency: query.currency,
                  }
                : {}),
              ...(query.interval
                ? {
                    interval: query.interval,
                  }
                : {}),
            },
          },
        },

        select: {
          id: true,
          name: true,
          description: true,

          plans: {
            where: {
              isActive: true,

              ...(query.currency
                ? {
                    currency: query.currency,
                  }
                : {}),

              ...(query.interval
                ? {
                    interval: query.interval,
                  }
                : {}),
            },

            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              currency: true,
              interval: true,
              isActive: true,
            },

            orderBy: {
              price: "asc",
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      },
    },

    orderBy: {
      name: "asc",
    },
  });

  if (!search) {
    return businesses;
  }

  return businesses
    .map((business) => ({
      ...business,

      services: business.services.filter(
        (service) => {
          const serviceMatches =
            service.name
              .toLowerCase()
              .includes(search) ||
            service.description
              ?.toLowerCase()
              .includes(search);

          const planMatches = service.plans.some(
            (plan) =>
              plan.name
                .toLowerCase()
                .includes(search) ||
              plan.description
                ?.toLowerCase()
                .includes(search)
          );

          return Boolean(
            serviceMatches || planMatches
          );
        }
      ),
    }))
    .filter(
      (business) =>
        business.services.length > 0
    );
}
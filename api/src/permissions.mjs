// Marketplace roles for Better Auth admin plugin.
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  marketplace: [
    "view-orders", "manage-orders", "refunds", "support",
    "payments", "promos", "metrics", "riders", "restaurants",
  ],
};

export const ac = createAccessControl(statement);

export const superadmin = ac.newRole({
  ...adminAc.statements,
  marketplace: [
    "view-orders", "manage-orders", "refunds", "support",
    "payments", "promos", "metrics", "riders", "restaurants",
  ],
});

export const support = ac.newRole({
  user: ["list", "get"],
  session: ["list"],
  marketplace: ["view-orders", "manage-orders", "refunds", "support"],
});

export const finance = ac.newRole({
  user: ["list", "get"],
  marketplace: ["payments", "promos", "metrics", "refunds"],
});

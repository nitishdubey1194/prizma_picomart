-- super_admin and admin: full access to every permission
insert into role_permissions (role, permission)
select 'super_admin', unnest(enum_range(null::app_permission));

insert into role_permissions (role, permission)
select 'admin', unnest(enum_range(null::app_permission));

-- vendor: the single business owner/staff role - manages store + bookings
insert into role_permissions (role, permission) values
  ('vendor', 'dashboard.view'),
  ('vendor', 'category.view'), ('vendor', 'category.create'), ('vendor', 'category.update'), ('vendor', 'category.delete'),
  ('vendor', 'product.view'), ('vendor', 'product.create'), ('vendor', 'product.update'), ('vendor', 'product.delete'),
  ('vendor', 'inventory.view'), ('vendor', 'inventory.update'),
  ('vendor', 'order.view_all'), ('vendor', 'order.update_status'), ('vendor', 'order.cancel'), ('vendor', 'order.refund'),
  ('vendor', 'payment.view'),
  ('vendor', 'report.sales'), ('vendor', 'report.orders'), ('vendor', 'payout.view'),
  ('vendor', 'profile.view'), ('vendor', 'profile.update'), ('vendor', 'address.manage'),
  ('vendor', 'booking.view_all'), ('vendor', 'booking.manage');

-- customer: self-scoped actions only
insert into role_permissions (role, permission) values
  ('customer', 'profile.view'), ('customer', 'profile.update'), ('customer', 'address.manage'),
  ('customer', 'cart.add'), ('customer', 'cart.update'), ('customer', 'cart.remove'),
  ('customer', 'order.view_own'), ('customer', 'order.create'), ('customer', 'order.cancel_own'),
  ('customer', 'payment.create'), ('customer', 'payment.view_own'),
  ('customer', 'booking.create'), ('customer', 'booking.view_own'), ('customer', 'booking.cancel_own');
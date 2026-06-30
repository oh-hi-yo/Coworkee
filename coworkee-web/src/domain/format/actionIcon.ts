/**
 * BR-16 — action type → FontAwesome icon class, ported from
 * overrides/util/Format.js actionIconCls. `profile`→user, `email`→envelope; skype and
 * linkedin use the brand pack (`x-fab`), everything else `x-fa`.
 */
export function actionIconCls(type: string): string {
  let t = type;
  switch (t) {
    case 'profile':
      t = 'user';
      break;
    case 'email':
      t = 'envelope';
      break;
    default:
      break;
  }
  const pack = t === 'skype' || t === 'linkedin' ? 'x-fab' : 'x-fa';
  return pack + ' fa-' + t;
}

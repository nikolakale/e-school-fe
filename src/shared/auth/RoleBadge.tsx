import { Badge } from '@/shared/ui/Badge'

import { ROLE_COLORS } from './roleColors'
import type { Role } from './types'

/** Role pill, colored per the role's slug. */
export function RoleBadge({ role }: { role: Role }) {
  const colors = ROLE_COLORS[role.slug]
  return (
    <Badge fg={colors.fg} bg={colors.bg}>
      {role.name}
    </Badge>
  )
}

export type RoleSlug =
  'ucenik' | 'nastavnik' | 'razredni_staresina' | 'direktor' | 'strucni_saradnik' | 'roditelj'

export interface Role {
  id: number
  slug: RoleSlug
  name: string
}

export interface ClassGroup {
  id: number
  name: string
  grade_level: number
}

export interface User {
  id: number
  name: string
  email: string
  role: Role
  class_group: ClassGroup | null
  permissions: string[]
}

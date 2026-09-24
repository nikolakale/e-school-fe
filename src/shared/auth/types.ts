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

export interface UserParent {
  id: number
  name: string
  email: string
}

export interface UserChild {
  id: number
  name: string
}

export interface TaughtSubject {
  id: number
  name: string
}

export interface TaughtClass {
  id: number
  name: string
}

export interface User {
  id: number
  name: string
  email: string
  role: Role
  class_group: ClassGroup | null
  permissions: string[]
  /** Always present; non-empty only when role.slug === 'ucenik'. */
  parents: UserParent[]
  /** Always present; non-empty only when role.slug === 'roditelj'. */
  children: UserChild[]
  /** Always present; non-empty only when role.slug is nastavnik/razredni_staresina. */
  taught_subjects: TaughtSubject[]
  /** Always present; non-empty only when role.slug is nastavnik/razredni_staresina. */
  taught_classes: TaughtClass[]
}

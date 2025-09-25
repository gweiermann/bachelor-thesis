export type HasKey<K extends PropertyKey, T> = { [P in K]: T };

export type LineCollector<Key extends string> = HasKey<Key, number>
export type ArrayCollector<Key extends string> = HasKey<Key, string[]>

export type VariableScope = Record<string, { value: string | number, isPointer: boolean, isReference: boolean, type: string }>
export type ScopeCollector<Key extends string> = HasKey<Key, VariableScope>
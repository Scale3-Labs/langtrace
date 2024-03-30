/* eslint-disable @typescript-eslint/no-unused-vars */

import { ChSchema, ClickhouseSchema } from './schema'

export interface ChDataType {
  typeStr: string
  toString: () => string
}

export type InferSchemaTypeClickhouse<T extends ClickhouseSchema<any>> = { [K in keyof T['schema']]: InferType<T['schema'][K]['type']> }

type ExtractInnerType<T extends string> = T extends `${infer _BeforeBracket}(${infer Rest})`
  ? ExtractInnerType<Rest>
  : T
type ExtractOuterType<T extends string> = T extends `${infer BeforeBracket}(${infer _Rest})`
  ? BeforeBracket
  : T

type InferTypeFromMap<T extends string> = ExtractInnerType<T> extends keyof MapSchemaTypes
  ? MapSchemaTypes[ExtractInnerType<T>]
  : ExtractOuterType<T> extends keyof MapSchemaTypes ?
    MapSchemaTypes[ExtractOuterType<T>]
    : unknown

type InferType<T extends ChDataType> =
T extends ChArray<infer ArrayType>
  ? Array<InferType<ArrayType>>
  : T extends ChJSON<infer Schema>
    ? { [K in keyof T['dataType']]: InferType<Schema[K]['type']> }
    : T extends ChDataType
      ? InferTypeFromMap<T['typeStr']>
      : unknown

interface MapSchemaTypes {
  UInt8: number
  UInt16: number
  UInt32: number
  UInt64: number
  Int8: number
  Int16: number
  Int32: number
  Int64: number
  Float32: number
  Float64: number
  Boolean: boolean
  String: string
  UUID: string
  Date: Date
  Date32: Date
  DateTime: Date
  DateTime64: Date
  FixedString: string
  Enum: Record<number, string>
}

export class ChUInt8 implements ChDataType {
  readonly typeStr: 'UInt8' = 'UInt8' as const
  constructor () {
    this.typeStr = 'UInt8'
  }

  toString (): string {
    return this.typeStr
  }
}

export class ChUInt16 implements ChDataType {
  readonly typeStr: 'UInt16' = 'UInt16' as const
  constructor () {
    this.typeStr = 'UInt16'
  }

  toString (): string {
    return this.typeStr
  }
}

export class ChUInt32 implements ChDataType {
  readonly typeStr: 'UInt32' = 'UInt32' as const
  toString (): string {
    return this.typeStr
  }
}

export class ChUInt64 implements ChDataType {
  readonly typeStr: 'UInt64' = 'UInt64' as const
  toString (): string {
    return this.typeStr
  }
}
export class ChInt8 implements ChDataType {
  readonly typeStr: 'Int8' = 'Int8' as const

  toString (): string {
    return this.typeStr
  }
}

export class ChInt16 implements ChDataType {
  readonly typeStr: 'Int16' = 'Int16' as const

  toString (): string {
    return this.typeStr
  }
}

export class ChFloat32 implements ChDataType {
  readonly typeStr: 'Float32' = 'Float32' as const

  toString (): string {
    return this.typeStr
  }
}

class ChFloat64 implements ChDataType {
  readonly typeStr: 'Float64' = 'Float64' as const
  toString (): string {
    return this.typeStr
  }
}

class ChBoolean implements ChDataType {
  readonly typeStr: 'Boolean' = 'Boolean' as const

  toString (): string {
    return this.typeStr
  }
}

class ChString implements ChDataType {
  readonly typeStr: 'String' = 'String' as const
  toString (): string {
    return this.typeStr
  }
}

class ChUUID implements ChDataType {
  readonly typeStr: 'UUID' = 'UUID' as const
  toString (): string {
    return this.typeStr
  }
}

class ChDate implements ChDataType {
  readonly typeStr: 'Date' = 'Date' as const
  toString (): string {
    return this.typeStr
  }
}

export class ChDate32 implements ChDataType {
  readonly typeStr: 'Date32' = 'Date32' as const

  toString (): string {
    return this.typeStr
  }
}

class ChDateTime<T extends string> implements ChDataType {
  readonly typeStr: `DateTime(${T})`
  constructor (readonly timezone: T) {
    this.typeStr = `DateTime(${timezone})`
  }

  toString (): string {
    return this.typeStr
  }
}

class ChDateTime64<T extends number, V extends string> implements ChDataType {
  readonly typeStr: `DateTime64(${T}, ${V})`
  constructor (readonly precision: T, readonly timezone: V) {
    this.typeStr = `DateTime64(${precision}, ${timezone})`
  }

  toString (): string {
    return this.typeStr
  }
}

class ChFixedString<T extends number> implements ChDataType {
  readonly typeStr: `FixedString(${string})`
  constructor (readonly length: T) {
    this.typeStr = `FixedString(${length})`
  }

  toString (): string {
    return this.typeStr
  }
}

class ChJSON<T extends ChSchema> implements ChDataType {
  readonly typeStr: 'JSON'
  constructor (readonly dataType: T) {
    this.typeStr = 'JSON'
  }

  toString (): string {
    return this.typeStr
  }
}
class ChArray<T extends ChDataType | ChArray<ChDataType>> implements ChDataType {
  readonly dataType: T
  readonly typeStr: string

  constructor (t: T) {
    if (t instanceof ChArray) {
      this.dataType = new ChArray(t.dataType) as T
    } else {
      this.dataType = t
    }
    this.typeStr = this.toString()
  }

  toString (): string {
    if (this.dataType instanceof ChArray) return `Array(${this.dataType.toString()})`
    return `Array(${this.dataType})`
  }
}

class ChEnum<T extends { [key: string]: number }> implements ChDataType {
  readonly typeStr: string
  readonly dataType: T

  constructor (enumObj: T) {
    this.dataType = enumObj
    this.typeStr = this.toString()
  }

  toString (): string {
    return `Enum(${Object.keys(this.dataType).map((key) => `'${key}' = ${this.dataType[key]}`).join(',')})`
  }
}

export const ClickhouseDataTypes = {
  UInt8: new ChUInt8(),
  UInt16: new ChUInt16(),
  UInt32: new ChUInt32(),
  UInt64: new ChUInt64(),
  Int8: new ChInt8(),
  Int16: new ChInt16(),
  Float32: new ChFloat32(),
  Float64: new ChFloat64(),
  Boolean: new ChBoolean(),
  String: new ChString(),
  UUID: new ChUUID(),
  Date: new ChDate(),
  Date32: new ChDate32(),
  DateTime: <TZ extends string>(timezone: TZ) => new ChDateTime(timezone),
  DateTime64: <P extends number, TZ extends string>(precision: P, timezone: TZ) => new ChDateTime64(precision, timezone),
  FixedString: <T extends number>(length: T) => new ChFixedString(length),
  JSON: <T extends ChSchema>(schema: T) => new ChJSON(schema),
  Array: <T extends ChDataType>(t: T) => new ChArray(t),
  Enum: <T extends { [key: string]: number }>(enumObj: T) => new ChEnum(enumObj)
}
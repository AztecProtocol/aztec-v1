type ZkAsset @entity {
  id: ID!
  address: Bytes!
  linkedTokenAddress: Bytes!
  scalingFactor: BigInt!
  canAdjustSupply: Boolean
  canConvert: Boolean
}

type Note @entity {
  id: ID!
  zkAsset: ZkAsset!
  owner: Account!
  metadata: Bytes!
  access: [NoteAccess!] @derivedFrom(field:"note")
  status: String!
}

type NoteAccess @entity {
  id: ID!
  note: Note!
  account: Account!
  sharedSecret: String!
}

type Account @entity {
  id: ID!
  address: Bytes!
}

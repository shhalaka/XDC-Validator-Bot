export const XDC_VALIDATOR_ABI = [
  // Events
  "event Vote(address _voter, address _candidate, uint256 _cap)",
  "event Unvote(address _voter, address _candidate, uint256 _cap)",
  "event Propose(address _owner, address _candidate, uint256 _cap)",
  "event Resign(address _owner, address _candidate)",
  "event Withdraw(address _owner, uint256 _blockNumber, uint256 _cap)",
  "event UploadedKYC(address _owner, string kycHash)",
  "event InvalidatedNode(address _masternodeOwner, address[] _masternodes)"
] as const;

export const XDC_VALIDATOR_MIN_ABI = [
  {
    inputs: [],
    name: "getValidators",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getActiveValidators",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getProposedValidators",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

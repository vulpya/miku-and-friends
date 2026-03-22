export interface EIDExtended extends EIDInterface {
  addCharacterInfo: (
    characterId: int,
    description: string,
    playerName?: string,
    language?: string,
  ) => void;
}

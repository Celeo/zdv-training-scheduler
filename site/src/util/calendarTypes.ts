// the calendar lib doesn't export its types

export type Range<T> = [T, T];
export type ValuePiece = Date | null;
export type Value = ValuePiece | Range<ValuePiece>;
export type View = "century" | "decade" | "year" | "month";
export type TileArgs = {
  activeStartDate: Date;
  date: Date;
  view: View;
};

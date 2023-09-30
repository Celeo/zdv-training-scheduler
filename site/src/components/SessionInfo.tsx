export type SessionInfoProps = {
  id: number;
  scheduleId: number | null;
  instructor: number;
  date: string;
  status: string;
};

export function SessionInfo(props: SessionInfoProps) {
  return <p>{JSON.stringify(props)}</p>;
}

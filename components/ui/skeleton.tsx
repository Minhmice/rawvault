type SkeletonProps = {
  height?: number;
};

export function Skeleton({ height = 48 }: SkeletonProps) {
  return <div className="rv-skeleton" style={{ height }} aria-hidden="true" />;
}

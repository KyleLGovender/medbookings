import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="mx-auto w-64 p-12">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

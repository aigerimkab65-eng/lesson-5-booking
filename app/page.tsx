import { Suspense } from "react";
import { BookingApp } from "@/components/BookingApp";

function BookingFallback() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="h-28 max-w-xl animate-pulse rounded-[28px] bg-surface-soft" />
      <div className="mt-8 space-y-3">
        <div className="h-6 w-56 animate-pulse rounded-xl bg-surface-soft" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-surface-soft"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<BookingFallback />}>
      <BookingApp />
    </Suspense>
  );
}

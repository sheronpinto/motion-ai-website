import { Suspense } from "react";
import DownloadClient from "./DownloadClient";

export const metadata = {
  title: "Download Motion-AI",
};

export default function DownloadPage() {
  return (
    <Suspense fallback={null}>
      <DownloadClient />
    </Suspense>
  );
}

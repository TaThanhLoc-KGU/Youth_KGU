import React from "react";
import { Spinner } from "zmp-ui";

export default function LoadingSpinner({ paddingTop = 60 }: { paddingTop?: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop }}>
      <Spinner />
    </div>
  );
}

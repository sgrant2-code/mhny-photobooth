import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0e0e10",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#f8f4ee",
            border: "6px solid #e75d43",
            borderRadius: "34px",
            display: "flex",
            height: 118,
            justifyContent: "center",
            width: 100,
          }}
        >
          <div
            style={{
              background: "#0e0e10",
              borderRadius: "50%",
              boxShadow: "0 0 0 7px #f8f4ee, 0 0 0 12px #0e0e10",
              height: 36,
              width: 36,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}

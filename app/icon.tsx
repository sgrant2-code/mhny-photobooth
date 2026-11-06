import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
            border: "16px solid #e75d43",
            borderRadius: "96px",
            display: "flex",
            height: 336,
            justifyContent: "center",
            width: 286,
          }}
        >
          <div
            style={{
              background: "#0e0e10",
              borderRadius: "50%",
              boxShadow: "0 0 0 20px #f8f4ee, 0 0 0 36px #0e0e10",
              height: 112,
              width: 112,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}

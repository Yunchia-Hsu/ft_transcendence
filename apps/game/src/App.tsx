import PongCanvas from "./pong/PongCanvas";

export default function App() {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      <PongCanvas />
    </div>
  );
}

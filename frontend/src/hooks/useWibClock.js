import { useEffect, useState } from "react";

/** Live WIB clock (Asia/Jakarta), formatted HH:MM:SS. */
export function useWibClock() {
  const [time, setTime] = useState("--:--:-- WIB");

  useEffect(() => {
    const tick = () => {
      try {
        const t = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date());
        setTime(`${t.replace(/\./g, ":")} WIB`);
      } catch {
        setTime("");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

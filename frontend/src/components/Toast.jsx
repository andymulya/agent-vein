import { useToast } from "../contexts/ToastContext";

/** Fixed bottom toast, driven by ToastContext. */
export default function Toast() {
  const { toast } = useToast();
  return (
    <div
      id="toast"
      role="status"
      className={`toast ${toast ? "show" : ""}`}
      dangerouslySetInnerHTML={{ __html: toast || "" }}
    />
  );
}

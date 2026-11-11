import { Component } from "react";

/**
 * Error boundary — a render throw in one section used to unmount the
 * whole site (black page). Each page section gets its own boundary so a
 * crash degrades to a fallback panel with a reload button instead.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="mx-auto max-w-[1180px] px-4 py-6">
          <div className="border-[3px] border-black bg-panel px-4 py-5 shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
            <div className="font-ui text-[0.85rem] font-bold tracking-wide text-blood">
              THIS SECTION FAILED TO LOAD
            </div>
            <p className="mt-2 text-[0.9rem] text-mut">
              Something broke while rendering this part of the page. The rest
              of the site still works — try reloading.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 border-2 border-black bg-blood px-4 py-2 font-ui text-[0.8rem] font-bold text-white"
            >
              ↻ RELOAD PAGE
            </button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="not-found section-pad" id="top">
      <div className="not-found-number">4<span>✳</span>4</div>
      <p className="section-kicker">WRONG TURN. GOOD COLOURS THOUGH.</p>
      <h1>This page wandered<br /><em>off the canvas.</em></h1>
      <Link href="/" className="button button-dark"><ArrowLeft size={18} /> Back to the good stuff</Link>
    </main>
  );
}

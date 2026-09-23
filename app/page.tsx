import styles from './conclusion.module.css';

export default function Home() {
  return <main className={styles.page}>
    <header className={styles.header}><a href="/">TIBO / RESET WATCHDOG</a><span>Independent experiment</span></header>
    <section className={styles.intro}>
      <p className={styles.label}>Experiment completed · 23 September 2026</p>
      <h1>A reset arrived.<br/><span>The experiment is complete.</span></h1>
      <p className={styles.lead}>We set out to follow public signals of an extra OpenAI Codex reset and explain the evidence in plain English. The project owner considers that experiment successful and has ended active monitoring.</p>
      <a className={styles.button} href="https://github.com/jlunse/tibo-reset-watchdog" target="_blank" rel="noreferrer">Explore the project on GitHub ↗</a>
    </section>
    <section className={styles.summary} aria-label="Experiment summary">
      <article><p className={styles.label}>What happened</p><h2>From a promise to an account report</h2><p>Tibo publicly promised a reset on 22 September. On 23 September, the project owner reported receiving and activating a saved reset. That supports delivery to one account; it does not establish that every eligible account received it.</p></article>
      <article><p className={styles.label}>What we learned</p><h2>Read the source. Keep the context.</h2><p>Staff statements were the most useful signals. Search results could miss important posts, and a promise, a rollout announcement and a delivery report each told a different part of the story. The outlook was an editorial judgement, not a measured probability.</p></article>
      <article><p className={styles.label}>What remains</p><h2>The work stays available</h2><p>This page records the conclusion of the experiment. There is no current reset forecast or next scheduled check. The code and methodology remain on GitHub, and retained reports can still be explored as historical records.</p><a className={styles.link} href="/history">Read earlier reports →</a></article>
    </section>
    <footer className={styles.footer}><span>An unofficial project. Not affiliated with OpenAI.</span><span>Completed, with the lessons preserved.</span></footer>
  </main>;
}

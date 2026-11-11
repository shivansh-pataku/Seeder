import React from 'react';
import Link from 'next/link';
import styles from '@/app/Styles/home.module.css';
import { ArrowUpRight, PenNib, Quotes, TextT } from '@phosphor-icons/react/dist/ssr';

export default function HeroBanner() {
  return (
    <main className={styles.landingPage}>
      <section className={styles.landingHero} aria-labelledby="landing-title">
        <div className={styles.landingCopy}>
          <span className={styles.landingKicker}>A quiet place for loud ideas</span>
          <h1 id="landing-title" className={styles.landingTitle}>
            Give your
            <br />
            thoughts a page.
          </h1>
          <p className={styles.landingSubtitle}>
            Write privately. Read deeply. Share the stories worth keeping.
          </p>
          <div className={styles.landingActions}>
            <Link href="/auth/signin?callbackUrl=/desk/new" className={styles.landingPrimaryBtn}>
              Start writing
              <ArrowUpRight size={16} weight="bold" />
            </Link>
            <Link href="/auth/signin?callbackUrl=/" className={styles.landingTextBtn}>
              Explore stories
            </Link>
          </div>
          <div className={styles.landingNote}>
            <span className={styles.landingNoteLine} />
            <span>Made for independent writers</span>
          </div>
        </div>

        <div className={styles.paperWindow} aria-hidden="true">
          <div className={styles.paperWindowTop}>
            <span className={styles.paperWindowLabel}>NEW DRAFT</span>
            <span className={styles.paperWindowDots}>•••</span>
          </div>
          <div className={styles.paperSheet}>
            <div className={styles.paperSheetHeader}>
              <span>Untitled story</span>
              <PenNib size={16} weight="regular" />
            </div>
            <div className={styles.paperRule} />
            <div className={styles.paperHeading}>
              <span className={styles.paperHeadingLine} />
              <span className={styles.paperHeadingLineShort} />
            </div>
            <div className={styles.paperText}>
              <span />
              <span />
              <span className={styles.paperTextShort} />
            </div>
            <div className={styles.paperQuote}>
              <Quotes size={22} weight="fill" />
              <span>Every story begins as a mark in the margin.</span>
            </div>
            <div className={styles.paperText}>
              <span />
              <span className={styles.paperTextShort} />
            </div>
          </div>
          <div className={styles.floatingCard}>
            <TextT size={17} weight="bold" />
            <span>Shape an idea</span>
          </div>
          <div className={styles.paperCaption}>01 / 03</div>
        </div>
      </section>
    </main>
  );
}

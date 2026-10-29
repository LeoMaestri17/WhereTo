import { DiscoveryBoard } from '@/components/trip/DiscoveryBoard';

/**
 * The front door is the board.
 *
 * There is no landing page and no wizard between arriving and seeing prices. The control strip
 * in the layout already knows enough to cost every destination, so the first thing on screen is
 * the answer rather than a question.
 */
export default function HomePage() {
  return <DiscoveryBoard />;
}

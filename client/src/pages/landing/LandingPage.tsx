import { ChatPanel } from '../../shared/ui/organisms/ChatPanel';
import { ConsolePanel } from '../../shared/ui/organisms/ConsolePanel';
export function LandingPage(){
  return (<main className="grid lg:grid-cols-2 min-h-[100dvh]"><ChatPanel/><ConsolePanel/></main>);
}

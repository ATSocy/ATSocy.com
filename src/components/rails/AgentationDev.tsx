import { Agentation } from 'agentation';

const endpoint = import.meta.env.PUBLIC_AGENTATION_ENDPOINT || 'http://localhost:4747';

export function AgentationDev() {
  return <Agentation endpoint={endpoint} />;
}

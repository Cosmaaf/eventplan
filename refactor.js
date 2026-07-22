const fs = require('fs');
const path = require('path');
const dir = './src/screens/organizer';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const routeMap = {
  'events': '/',
  'create_event': '/events/new',
  'event_detail': '/events/1',
  'guests': '/events/1/guests',
  'tables': '/events/1/tables',
  'reminders': '/events/1/reminders',
  'settings': '/settings',
  'trash_bin': '/trash'
};

for (const file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  
  if (!content.includes('useNavigate')) {
    if (content.includes('import { useState')) {
      content = content.replace('import { useState', 'import { useNavigate } from \'react-router-dom\';\nimport { useState');
    } else {
      content = 'import { useNavigate } from \'react-router-dom\';\n' + content;
    }
  }

  content = content.replace(/type Props = \{[\s\S]*?\};\n+/, '');
  content = content.replace(/export default function \w+\(\w*\s*:\s*Props\)\s*\{/, (match) => {
    return match.replace(/\{[^}]+\}/, '()').replace(/:\s*Props/, '');
  });
  content = content.replace(/export default function \w+\(\{.*?\}\)\s*\{/, (match) => {
    return match.replace(/\{.*?\}/, '()');
  });

  if (content.match(/export default function \w+\(\)\s*\{/)) {
    content = content.replace(/(export default function \w+\(\)\s*\{)/, '\\n  const navigate = useNavigate();\n');
  }

  content = content.replace(/onNavigate\(['"](\w+)['"]\)/g, (m, screen) => {
    return 
avigate('');
  });
  
  content = content.replace(/onNavigate\(f\.id as OrganizerScreen\)/g, 'navigate(/events/1/)');
  content = content.replace(/import \{ OrganizerScreen \} from '\.\.\/\.\.\/OrganizerApp';\n/, '');

  fs.writeFileSync(path.join(dir, file), content);
}
console.log('Refactored screens');

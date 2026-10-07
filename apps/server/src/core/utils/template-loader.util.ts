import * as fs from 'node:fs';
import * as path from 'node:path';
import * as handlebars from 'handlebars';

const templateCache = new Map<string, handlebars.TemplateDelegate>();

function resolveTemplatePath(relativePath: string): string {
  const candidates = [
    path.resolve(process.cwd(), 'templates', relativePath),
    path.resolve(process.cwd(), 'apps/server/templates', relativePath),
    path.resolve(__dirname, '../../../templates', relativePath),
    path.resolve(__dirname, '../../../../templates', relativePath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Template not found for "${relativePath}". Searched locations:\n${candidates.join('\n')}`,
  );
}

export function renderTemplate(
  relativePath: string,
  context: Record<string, unknown>,
): string {
  let template = templateCache.get(relativePath);
  if (!template) {
    const fullPath = resolveTemplatePath(relativePath);
    const source = fs.readFileSync(fullPath, 'utf-8');
    template = handlebars.compile(source);
    templateCache.set(relativePath, template);
  }
  return template(context);
}

export const TemplateLoaderUtil = {
  render: renderTemplate,
};

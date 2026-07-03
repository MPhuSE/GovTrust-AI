import { existsSync } from 'fs';
import { resolve } from 'path';
import { MVP_PROCEDURES } from './mvp-procedures';

describe('MVP procedure registry', () => {
  it('defines three procedures with unique codes and output templates', () => {
    expect(MVP_PROCEDURES).toHaveLength(3);
    expect(new Set(MVP_PROCEDURES.map(item => item.code)).size).toBe(3);
    expect(MVP_PROCEDURES.every(item => item.outputTemplate?.key)).toBe(true);
  });

  it('only maps SmartForm fields to checklist slots that exist', () => {
    for (const procedure of MVP_PROCEDURES) {
      const checklistIds = new Set(procedure.checklist.map(item => item.id));
      for (const field of procedure.formFields) {
        for (const sourceMap of field.sourceMap) {
          expect(checklistIds.has(sourceMap.split('.')[0])).toBe(true);
        }
      }
    }
  });

  it('has a renderable DOCX for every distinct output form', () => {
    const root = resolve(process.cwd(), '..', '..', 'template', 'renderable');
    for (const procedure of MVP_PROCEDURES) {
      const file = `${procedure.outputTemplate!.key}.docx`;
      expect(existsSync(resolve(root, file))).toBe(true);
    }
  });
});

import { generatePublicSlug } from './pet.service';

describe('generatePublicSlug', () => {
  it('creates a slug with suffix', () => {
    const slug = generatePublicSlug('Luna da Silva');
    expect(slug).toMatch(/^luna-da-silva-[a-z0-9]{6}$/);
  });

  it('handles empty/invalid names', () => {
    const slug = generatePublicSlug('   ');
    expect(slug).toMatch(/^pet-[a-z0-9]{6}$/);
  });
});


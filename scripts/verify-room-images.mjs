import { createClient } from '@supabase/supabase-js';

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const roomDefs = [
  { slug: "deluxe-king", name: "Deluxe King Room" },
  { slug: "premier-executive", name: "Premier Executive Suite" },
  { slug: "royal-fremont", name: "The Royal Fremont Suite" },
  { slug: "presidential-penthouse", name: "Presidential Penthouse" }
];

async function verify() {
  const { data: rows, error } = await client.from('image_slots').select('*');
  if (error) {
    console.error('Error fetching image_slots:', error);
    process.exit(1);
  }

  const slots = {};
  for (const r of rows) {
    let finalUrl = r.url;
    if (r.updated_at) finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'v=' + new Date(r.updated_at).getTime();
    slots[r.slot_key] = { url: finalUrl, altText: r.alt_text };
    if (r.slot_key.includes('.gallery-')) slots[r.slot_key.replace('.gallery-', '.gallery.')] = { url: finalUrl, altText: r.alt_text };
    if (r.slot_key.includes('.gallery.')) slots[r.slot_key.replace('.gallery.', '.gallery-')] = { url: finalUrl, altText: r.alt_text };
  }

  const report = roomDefs.map(room => {
    const mainSlot = slots[`rooms.${room.slug}.main`];
    const mainUrl = mainSlot?.url || '/assets/placeholder.svg';
    const mainAlt = mainSlot?.altText || room.name;

    const galleryUrls = [mainUrl];
    for (let i = 1; i <= 4; i++) {
      const gSlot = slots[`rooms.${room.slug}.gallery-${i}`] || slots[`rooms.${room.slug}.gallery.${i}`];
      if (gSlot?.url && gSlot.url.trim() !== '' && gSlot.url !== '/assets/placeholder.svg') {
        galleryUrls.push(gSlot.url);
      }
    }

    return {
      slug: room.slug,
      name: room.name,
      cardImageFilename: mainUrl.split('/').pop().split('?')[0],
      modalMainImageFilename: galleryUrls[0].split('/').pop().split('?')[0],
      areIdentical: mainUrl === galleryUrls[0],
      galleryCount: galleryUrls.length,
      thumbnailsStripHidden: galleryUrls.length <= 1,
    };
  });

  console.log('\n================ ROOM CARD VS MODAL VERIFICATION ================');
  console.table(report);

  // Check duplicate URLs across all room slots
  const urls = report.map(r => r.cardImageFilename).filter(u => u !== 'placeholder.svg');
  const uniqueUrls = new Set(urls);
  console.log('\nTotal active room main images:', urls.length);
  console.log('Unique active room main images:', uniqueUrls.size);
  console.log('Duplicates detected:', urls.length !== uniqueUrls.size ? 'YES (BUG)' : 'NONE (PASSED)');

  // Check banquet image
  const banquetUsedOnRoom = urls.some(u => u.includes('af26f1d2-3aa1-4cb3-b1b8-15f9d9'));
  console.log('Banquet hall photo on room card:', banquetUsedOnRoom ? 'YES (BUG)' : 'NO (PASSED)');
}

verify();


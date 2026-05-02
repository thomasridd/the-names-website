const fs = require('fs');
const path = require('path');

// Shared squared Euclidean distance for k-means across all three cluster analyses
const sqDist = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return s;
};

// Run Lloyd's algorithm; mutates centroids in place, returns assignments array
function kMeans(vectors, centroids, maxIter = 100) {
  const N = vectors.length;
  const K = centroids.length;
  const assignments = new Array(N).fill(-1);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < N; i++) {
      let best = 0, bestD = sqDist(vectors[i], centroids[0]);
      for (let c = 1; c < K; c++) {
        const d = sqDist(vectors[i], centroids[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (assignments[i] !== best) { assignments[i] = best; changed = true; }
    }
    if (!changed && iter > 0) break;

    const dim = vectors[0].length;
    for (let c = 0; c < K; c++) {
      const sum = new Array(dim).fill(0);
      let count = 0;
      for (let i = 0; i < N; i++) {
        if (assignments[i] !== c) continue;
        for (let j = 0; j < dim; j++) sum[j] += vectors[i][j];
        count++;
      }
      if (count === 0) continue;
      for (let j = 0; j < dim; j++) sum[j] /= count;
      centroids[c] = sum;
    }
  }

  return assignments;
}

// Build a method output object: groups entries by label, computes per-cluster centroid
function buildMethod(name, description, labels, entries, assignments, sortFn, D) {
  const groups = {};
  for (const label of labels) groups[label] = [];
  entries.forEach((e, i) => groups[assignments[i]].push(e));

  const clusters = labels.map(label => {
    const members = sortFn(groups[label]);
    const centroid = new Array(D).fill(0);
    if (members.length > 0) {
      for (const m of members) for (let j = 0; j < D; j++) centroid[j] += m.bin100[j];
      for (let j = 0; j < D; j++) centroid[j] /= members.length;
    }
    return { label, description: undefined, count: members.length, centroid, members };
  });

  return { name, description, clusters };
}

function loadNameData(filePath, gender, filterFn, mapFn) {
  if (!fs.existsSync(filePath)) return [];
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const results = [];
  for (const n of data) {
    if (!filterFn(n)) continue;
    results.push(mapFn(n, gender));
  }
  return results;
}

function registerAnalysisClusters(eleventyConfig, dataSuffix) {
  const DECADES = ['1904', '1914', '1924', '1934', '1944', '1954', '1964', '1974', '1984', '1994', '2004', '2014', '2024'];
  const D = DECADES.length;

  // ---------- historicClusters ----------
  eleventyConfig.addGlobalData('historicClusters', () => {
    const boysPath = path.join(__dirname, '..', 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, '..', 'data', `girls${dataSuffix}`);

    const filter = n =>
      typeof n.rank === 'number' && n.rank >= 1 && n.rank <= 100 &&
      Array.isArray(n.rankHistoric) && n.rankHistoric.length === D;

    const toEntry = (n, gender) => {
      const vec = n.rankHistoric.map(v => {
        const r = parseInt(v, 10);
        return (!isNaN(r) && r >= 1 && r <= 100) ? 1 : 0;
      });
      return { name: n.name, gender, uniqueSlug: n.uniqueSlug, rank: n.rank, vector: vec, rankHistoric: n.rankHistoric };
    };

    const entries = [
      ...loadNameData(boysPath, 'Boy', filter, toEntry),
      ...loadNameData(girlsPath, 'Girl', filter, toEntry)
    ];

    if (entries.length === 0) {
      console.log('No entries for historic clustering');
      return { clusters: [], decades: DECADES, total: 0 };
    }

    // Seeded RNG for deterministic k-means++ initialisation
    let rngState = 42;
    const rng = () => { rngState = (rngState * 1664525 + 1013904223) >>> 0; return rngState / 4294967296; };

    const K = 4;
    const vectors = entries.map(e => e.vector);
    const N = vectors.length;

    // k-means++ init
    const centroids = [vectors[Math.floor(rng() * N)].slice()];
    while (centroids.length < K) {
      const dists = vectors.map(v => Math.min(...centroids.map(c => sqDist(v, c))));
      const total = dists.reduce((a, b) => a + b, 0);
      if (total === 0) { centroids.push(vectors[Math.floor(rng() * N)].slice()); continue; }
      let r = rng() * total, idx = 0;
      for (let i = 0; i < N; i++) { r -= dists[i]; if (r <= 0) { idx = i; break; } }
      centroids.push(vectors[idx].slice());
    }

    const assignments = kMeans(vectors, centroids);

    const clusters = centroids.map((centroid, c) => {
      const members = [];
      for (let i = 0; i < N; i++) if (assignments[i] === c) members.push(entries[i]);
      members.sort((a, b) => {
        const ra = a.rank ?? 1e9, rb = b.rank ?? 1e9;
        return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
      });

      const onIdx = centroid.map((v, i) => v >= 0.5 ? i : -1).filter(i => i >= 0);
      let label;
      if (onIdx.length === 0) {
        label = `Peak ${DECADES[centroid.indexOf(Math.max(...centroid))]}s`;
      } else if (onIdx.length === D) {
        label = `Every decade (${DECADES[0]}–${DECADES[D - 1]})`;
      } else {
        label = `${DECADES[onIdx[0]]}–${DECADES[onIdx[onIdx.length - 1]]}`;
      }

      return { index: c, label, centroid, count: members.length, members };
    });

    // Order by centroid "centre of mass" (earliest average decade first)
    clusters.sort((a, b) => {
      const com = v => { let num = 0, den = 0; for (let i = 0; i < v.length; i++) { num += i * v[i]; den += v[i]; } return den > 0 ? num / den : Infinity; };
      return com(a.centroid) - com(b.centroid);
    });
    clusters.forEach((cl, i) => cl.index = i);

    console.log(`Generated ${clusters.length} historic clusters over ${N} names`);
    return { clusters, decades: DECADES, total: N };
  });

  // ---------- labelledClusters ----------
  eleventyConfig.addGlobalData('labelledClusters', () => {
    const boysPath = path.join(__dirname, '..', 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, '..', 'data', `girls${dataSuffix}`);

    const LABELS = ['Classics', 'Modern classics', 'Shooting stars', 'Vintage revival'];
    const LABEL_DESCRIPTIONS = {
      'Classics': 'Consistently popular across the century.',
      'Modern classics': 'Consistently popular in recent decades.',
      'Shooting stars': 'New arrivals to the top 100.',
      'Vintage revival': 'Popular early, disappeared, back again.'
    };

    const filter = n =>
      typeof n.rank === 'number' && n.rank >= 1 && n.rank <= 100 &&
      Array.isArray(n.rankHistoric) && n.rankHistoric.length === D;

    const toEntry = (n, gender) => {
      const numericRanks = n.rankHistoric.map(v => { const r = parseInt(v, 10); return isNaN(r) ? null : r; });
      const bin100 = numericRanks.map(r => (r !== null && r >= 1 && r <= 100) ? 1 : 0);
      const bin50  = numericRanks.map(r => (r !== null && r >= 1 && r <= 50) ? 1 : 0);
      const ternary = numericRanks.map(r => { if (r === null || r > 100) return 0; return r > 50 ? 1 : 2; });

      const sumTop100 = bin100.reduce((a, b) => a + b, 0);
      const sumTop50  = bin50.reduce((a, b) => a + b, 0);
      const firstTop100 = bin100.indexOf(1);
      const lastTop100  = bin100.lastIndexOf(1);
      let longestGap = 0;
      if (firstTop100 !== -1 && lastTop100 !== -1 && firstTop100 !== lastTop100) {
        let gap = 0;
        for (let i = firstTop100 + 1; i < lastTop100; i++) {
          if (bin100[i] === 0) { gap++; if (gap > longestGap) longestGap = gap; } else gap = 0;
        }
      }
      let top50Crossings = 0;
      for (let i = 1; i < D; i++) { if (bin50[i] !== bin50[i - 1]) top50Crossings++; }

      return { name: n.name, gender, uniqueSlug: n.uniqueSlug, rank: n.rank, bin100, bin50, ternary,
               features: { sumTop100, sumTop50, firstTop100, lastTop100, longestGap, top50Crossings } };
    };

    const entries = [
      ...loadNameData(boysPath, 'Boy', filter, toEntry),
      ...loadNameData(girlsPath, 'Girl', filter, toEntry)
    ];

    if (entries.length === 0) {
      return { decades: DECADES, labels: LABELS, descriptions: LABEL_DESCRIPTIONS, methods: [], total: 0 };
    }

    const sortMembers = arr => arr.slice().sort((a, b) => {
      const ra = a.rank ?? 1e9, rb = b.rank ?? 1e9;
      return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
    });

    // Method A: priority-ordered rules
    const assignA = (e) => {
      const f = e.features, bin = e.bin100;
      const earlyCount  = bin.slice(0, D - 2).reduce((a, b) => a + b, 0);
      const recentCount = bin.slice(D - 2).reduce((a, b) => a + b, 0);
      if (recentCount >= 1 && earlyCount <= 1 && f.sumTop100 <= 2) return 'Shooting stars';
      const earlyHit  = bin.slice(0, 4).some(b => b === 1);
      const midHit    = bin.slice(4, 9).some(b => b === 1);
      const recentHit = bin.slice(9).some(b => b === 1);
      if (earlyHit && !midHit && recentHit) return 'Vintage revival';
      if (f.sumTop100 >= 10) return 'Classics';
      return 'Modern classics';
    };

    // Method B: nearest prototype in ternary decade space
    const prototypesB = {
      'Classics':        [2,2,2,2,2,2,2,2,2,2,2,2,2],
      'Modern classics': [0,0,0,0,0,0,0,0,1,1,2,2,2],
      'Shooting stars':  [0,0,0,0,0,0,0,0,0,0,0,0,2],
      'Vintage revival': [2,2,2,1,0,0,0,0,0,0,1,2,2]
    };
    const assignB = (e) => {
      let bestLabel = LABELS[0], bestD = Infinity;
      for (const label of LABELS) { const d = sqDist(e.ternary, prototypesB[label]); if (d < bestD) { bestD = d; bestLabel = label; } }
      return bestLabel;
    };

    // Method C: k-means in feature space, prototype-seeded
    const toFeature = (e) => {
      const f = e.features;
      return [f.sumTop100 / 13, f.sumTop50 / 13,
              (f.firstTop100 === -1) ? 1 : f.firstTop100 / 12,
              (f.lastTop100  === -1) ? 0 : f.lastTop100 / 12,
              f.longestGap / 13];
    };
    const featureVectors = entries.map(toFeature);
    const centroidsC = LABELS.map(l => ({
      'Classics':        [1.00, 0.70, 0.00, 1.00, 0.00],
      'Modern classics': [0.40, 0.30, 0.60, 1.00, 0.00],
      'Shooting stars':  [0.10, 0.00, 1.00, 1.00, 0.00],
      'Vintage revival': [0.30, 0.15, 0.00, 1.00, 0.60]
    }[l].slice()));
    const assignmentsC = kMeans(featureVectors, centroidsC);

    const makeMethod = (methodName, description, rawAssignments) =>
      buildMethod(methodName, description, LABELS, entries, rawAssignments, sortMembers, D);

    const methods = [
      makeMethod(
        'Method 1 — Priority-ordered rules',
        'A decision list evaluated top to bottom. Each name takes the first rule it matches: only-recent → Shooting star; early + recent with a mid-century gap → Vintage revival; ≥10 of 13 decades in the top 100 → Classic; everything else → Modern classic.',
        entries.map(assignA)
      ),
      makeMethod(
        'Method 2 — Nearest prototype (ternary decades)',
        'Each decade is encoded as 0 (outside top 100), 1 (51–100) or 2 (top 50). Each category has a hand-crafted prototype vector of this shape, and every name is assigned to the prototype it is closest to by Euclidean distance.',
        entries.map(assignB)
      ),
      makeMethod(
        'Method 3 — Feature-space k-means (prototype-seeded)',
        'Five summary features per name (share in top 100, share in top 50, first top-100 decade, last top-100 decade, longest gap between top-100 decades). K-means is run with k=4 using labelled prototype centroids as the initial seeds, so each converged cluster keeps its intended label.',
        assignmentsC.map(i => LABELS[i])
      )
    ];

    // Restore per-cluster label descriptions (buildMethod leaves them undefined)
    methods.forEach(m => m.clusters.forEach(cl => { cl.description = LABEL_DESCRIPTIONS[cl.label]; }));

    console.log(`Labelled clustering computed over ${entries.length} names across ${methods.length} methods`);
    return { decades: DECADES, labels: LABELS, descriptions: LABEL_DESCRIPTIONS, methods, total: entries.length };
  });

  // ---------- fadedNames ----------
  eleventyConfig.addGlobalData('fadedNames', () => {
    const boysPath = path.join(__dirname, '..', 'data', `boys${dataSuffix}`);
    const girlsPath = path.join(__dirname, '..', 'data', `girls${dataSuffix}`);

    const LABELS = ['Past classics', 'Golden generation', 'Past stars', 'Of a time', 'Past revival'];
    const LABEL_DESCRIPTIONS = {
      'Past classics':     'Consistently popular for decades, now fallen out of the top 100.',
      'Golden generation': 'Only popular in the first decades of the twentieth century.',
      'Past stars':        'A short spell in the top 100; now gone.',
      'Of a time':         'Several consecutive decades in the top 100.',
      'Past revival':      'Popular early, came back for a revival, out of favour now.'
    };

    const filter = n => {
      if (!Array.isArray(n.rankHistoric) || n.rankHistoric.length !== D) return false;
      if (n.rankHistoric[D - 1] !== 'x') return false;
      return n.rankHistoric.some(v => { const r = parseInt(v, 10); return !isNaN(r) && r >= 1 && r <= 100; });
    };

    const toEntry = (n, gender) => {
      const numericRanks = n.rankHistoric.map(v => { const r = parseInt(v, 10); return isNaN(r) ? null : r; });
      const bin100 = numericRanks.map(r => (r !== null && r >= 1 && r <= 100) ? 1 : 0);
      const bin30  = numericRanks.map(r => (r !== null && r >= 1 && r <= 30) ? 1 : 0);
      const ternary = numericRanks.map(r => { if (r === null || r < 1 || r > 100) return 0; return r <= 30 ? 2 : 1; });

      const sumTop100 = bin100.reduce((a, b) => a + b, 0);
      const sumTop30  = bin30.reduce((a, b) => a + b, 0);
      const firstTop100 = bin100.indexOf(1);
      const lastTop100  = bin100.lastIndexOf(1);
      let longestGap = 0;
      if (firstTop100 !== -1 && lastTop100 !== -1 && firstTop100 !== lastTop100) {
        let gap = 0;
        for (let i = firstTop100 + 1; i < lastTop100; i++) {
          if (bin100[i] === 0) { gap++; if (gap > longestGap) longestGap = gap; } else gap = 0;
        }
      }
      return { name: n.name, gender, uniqueSlug: n.uniqueSlug, bin100, bin30, ternary, ranks: numericRanks,
               features: { sumTop100, sumTop30, firstTop100, lastTop100, longestGap } };
    };

    const entries = [
      ...loadNameData(boysPath, 'Boy', filter, toEntry),
      ...loadNameData(girlsPath, 'Girl', filter, toEntry)
    ];

    if (entries.length === 0) {
      return { decades: DECADES, labels: LABELS, descriptions: LABEL_DESCRIPTIONS, methods: [], total: 0, all: [] };
    }

    const sortByArc = arr => arr.slice().sort((a, b) => {
      const fa = a.features.firstTop100, fb = b.features.firstTop100;
      if (fa !== fb) return fa - fb;
      const la = a.features.lastTop100, lb = b.features.lastTop100;
      if (la !== lb) return la - lb;
      return a.name.localeCompare(b.name);
    });

    // Method A: priority-ordered rules
    const assignA = (e) => {
      const f = e.features, bin = e.bin100;
      const earlyHit  = bin.slice(0, 4).some(b => b === 1);
      const lateHit   = bin.slice(8, 12).some(b => b === 1);
      const postEarly = bin.slice(5, 13).some(b => b === 1);
      if (earlyHit && lateHit && f.longestGap >= 3) return 'Past revival';
      if (f.sumTop100 >= 6 && f.longestGap <= 2) return 'Past classics';
      if (!postEarly && earlyHit) return 'Golden generation';
      if (f.sumTop100 >= 3) return 'Of a time';
      return 'Past stars';
    };

    // Method B: nearest prototype in ternary decade space
    //                        1904 1914 1924 1934 1944 1954 1964 1974 1984 1994 2004 2014 2024
    const prototypesB = {
      'Past classics':    [2,   2,   2,   2,   2,   2,   2,   1,   1,   1,   0,   0,   0],
      'Golden generation':[2,   2,   2,   2,   1,   0,   0,   0,   0,   0,   0,   0,   0],
      'Past stars':       [0,   0,   0,   0,   0,   0,   0,   0,   1,   2,   1,   0,   0],
      'Of a time':        [0,   0,   0,   1,   2,   2,   2,   1,   0,   0,   0,   0,   0],
      'Past revival':     [2,   2,   1,   0,   0,   0,   0,   0,   1,   2,   2,   0,   0]
    };
    const assignB = (e) => {
      let bestLabel = LABELS[0], bestD = Infinity;
      for (const label of LABELS) { const d = sqDist(e.ternary, prototypesB[label]); if (d < bestD) { bestD = d; bestLabel = label; } }
      return bestLabel;
    };

    // Method C: k-means in feature space, prototype-seeded
    const toFeature = (e) => {
      const f = e.features;
      const first = (f.firstTop100 === -1) ? 11 : f.firstTop100;
      const last  = (f.lastTop100  === -1) ? 0  : f.lastTop100;
      const span  = (f.firstTop100 === -1 || f.lastTop100 === -1) ? 0 : (f.lastTop100 - f.firstTop100);
      return [f.sumTop100 / 12, first / 11, last / 11, f.longestGap / 12, span / 11];
    };
    const featureVectors = entries.map(toFeature);
    const initialCentroidsC = {
      'Past classics':    [0.70, 0.00, 0.85, 0.10, 0.80],
      'Golden generation':[0.30, 0.00, 0.30, 0.00, 0.30],
      'Past stars':       [0.12, 0.70, 0.75, 0.00, 0.05],
      'Of a time':        [0.30, 0.35, 0.60, 0.00, 0.30],
      'Past revival':     [0.55, 0.05, 0.90, 0.40, 0.85]
    };
    const centroidsC = LABELS.map(l => initialCentroidsC[l].slice());
    const assignmentsC = kMeans(featureVectors, centroidsC);

    // Hybrid hard rules shared by Methods D and E
    const hybridRule = (e) => {
      const bin = e.bin100, f = e.features;
      if (!bin.slice(4).some(b => b === 1)) return 'Golden generation';
      if (f.sumTop100 === 1) return 'Past stars';
      if (f.sumTop100 === 2 && (f.lastTop100 - f.firstTop100) === 1) return 'Past stars';
      return null;
    };

    // Method D: hybrid rules + nearest prototype for remainder
    const remainingLabels = ['Past classics', 'Of a time', 'Past revival'];
    const assignD = (e) => {
      const ruled = hybridRule(e);
      if (ruled) return ruled;
      let bestLabel = remainingLabels[0], bestD = Infinity;
      for (const label of remainingLabels) { const d = sqDist(e.ternary, prototypesB[label]); if (d < bestD) { bestD = d; bestLabel = label; } }
      return bestLabel;
    };

    // Method E: hybrid rules + k-means on remainder
    const assignmentsE = new Array(entries.length);
    const remainingIndices = [];
    entries.forEach((e, i) => {
      const ruled = hybridRule(e);
      if (ruled) assignmentsE[i] = ruled;
      else remainingIndices.push(i);
    });
    if (remainingIndices.length > 0) {
      const centroidsE = remainingLabels.map(l => initialCentroidsC[l].slice());
      const subVectors = remainingIndices.map(i => featureVectors[i]);
      const subAssign = kMeans(subVectors, centroidsE);
      for (let k = 0; k < remainingIndices.length; k++) {
        assignmentsE[remainingIndices[k]] = remainingLabels[subAssign[k]];
      }
    }

    const makeMethod = (methodName, description, rawAssignments) =>
      buildMethod(methodName, description, LABELS, entries, rawAssignments, sortByArc, D);

    const methods = [
      makeMethod(
        'Method 1 — Priority-ordered rules',
        'A decision list evaluated top to bottom on each name: early + late top-100 presence with a gap of 3+ empty decades → Past revival; ≥6 decades in the top 100 with gaps no longer than 1 decade → Past classic; only ever top 100 in the first five decades (1904–1944) → Golden generation; 3+ decades in the top 100 otherwise → Of a time; everything else → Past star.',
        entries.map(assignA)
      ),
      makeMethod(
        'Method 2 — Nearest prototype (ternary decades)',
        'Each decade is encoded as 0 (outside top 100), 1 (31–100) or 2 (top 30). Each label has a hand-crafted 13-decade prototype vector of this shape, and every name is assigned to the prototype it is closest to by Euclidean distance.',
        entries.map(assignB)
      ),
      makeMethod(
        'Method 3 — Feature-space k-means (prototype-seeded)',
        'Five features per name (share in top 100, first/last top-100 decade, longest gap between top-100 decades, span from first to last). K-means with k=5 is seeded by labelled prototype centroids, so each converged cluster keeps its intended label.',
        assignmentsC.map(i => LABELS[i])
      ),
      makeMethod(
        'Method 4 — Hybrid rules + nearest prototype',
        'Two priority rules run first: (1) if a name is never in the top 100 after 1934 it is Golden generation; (2) if it has just one top-100 decade, or two consecutive decades, it is a Past star. Every remaining name is assigned to its closest ternary-decade prototype among Past classics, Of a time and Past revival.',
        entries.map(assignD)
      ),
      makeMethod(
        'Method 5 — Hybrid rules + k-means on remainder',
        'The same two priority rules assign the clear-cut Golden generation and Past star cases. The remaining names are clustered with k-means (k=3) in the same 5-feature space as Method 3, seeded by the Past classics / Of a time / Past revival prototypes so each converged cluster keeps its intended label.',
        assignmentsE
      )
    ];

    // Restore per-cluster label descriptions
    methods.forEach(m => m.clusters.forEach(cl => { cl.description = LABEL_DESCRIPTIONS[cl.label]; }));

    console.log(`Faded names: ${entries.length} names clustered via ${methods.length} methods`);
    return { decades: DECADES, labels: LABELS, descriptions: LABEL_DESCRIPTIONS, methods,
             total: entries.length, all: sortByArc(entries) };
  });
}

module.exports = { registerAnalysisClusters };

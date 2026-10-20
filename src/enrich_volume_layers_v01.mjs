/**
 * Backfill site_layer / level / category pe mesh-uri fără tag.
 * Folosit din build_v47_3d sau: node src/enrich_volume_layers_v01.mjs [volume.json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function enrichMeshMeta(m) {
  const id = m.id || "";
  let z0 = m.z0_m;
  let z1 = m.z1_m;
  if ((z0 == null || z1 == null) && m.vertices?.length) {
    const zs = m.vertices.map((v) => v.z || 0);
    z0 = Math.min(...zs);
    z1 = Math.max(...zs);
  }
  z0 = z0 ?? 0;
  z1 = z1 ?? 0;
  const zMid = (z0 + z1) / 2;

  let level = m.level || null;
  if (!level) {
    if (
      id.startsWith("subsol_") ||
      id.startsWith("put_reten_") ||
      id.startsWith("fundatie_") ||
      id.startsWith("usa_beci") ||
      id.startsWith("usa_magazie") ||
      id.startsWith("usa_ct_") ||
      zMid < -0.2
    )
      level = "subsol";
    else if (/_L1\b|_e$|_e_e$|_etaj|fatada_scara_lamele|fatada_scara_solid/.test(id) || zMid >= 3.2)
      level = "etaj";
    else if (/_L0\b|_p$|_p_p$/.test(id)) level = "parter";
    else if (zMid >= 3.2) level = "etaj";
    else level = "parter";
  }

  let category = m.category && m.category !== "necunoscut" ? m.category : null;
  let site_layer = m.site_layer && m.site_layer !== "necunoscut" ? m.site_layer : null;

  if (!category || !site_layer) {
    if (/^(stalp_|subsol_fg_|fundatie_|parter_centura_|etaj_centura_|parter_grinda_|etaj_grinda_|subsol_grinda_|subsol_reten_|put_reten_|structura_|treapta_|acces_treapta_|podest_se_placa|palier_.*placa|etaj_placa)/.test(id) ||
        id.includes("grinda") ||
        id.startsWith("acoperis_structura") ||
        id.startsWith("acoperis_caprior") ||
        id.startsWith("acoperis_coama") ||
        id.startsWith("acoperis_solbanc")) {
      category = category || "structura";
      site_layer = site_layer || "structura";
    } else if (/^(zid_|col_facade_|etics_|separator_vata_|fatada_scara_)/.test(id) || id.startsWith("soclu_")) {
      category = category || "zidarie";
      site_layer = site_layer || (id.startsWith("soclu_") || id.startsWith("fatada_") ? "anvelopa" : "umplutura");
    } else if (/^(sticla_|toc_|usa_panou_|gol_)/.test(id) || id.startsWith("usa_")) {
      category = category || "tamplarie";
      site_layer = site_layer || (id.startsWith("gol_") ? "goluri" : "finisaj");
    } else if (/^(pardoseala_|subsol_pardoseala|mozaic_)/.test(id)) {
      category = category || "finisaj";
      site_layer = site_layer || "finisaj";
    } else if (/^(mobil|masa_|scaun_|canapea_|pat_|dulap_|blat_|chiuveta_|wc_|lavoar_|dus_)/i.test(id)) {
      category = category || "mobilier";
      site_layer = site_layer || "mobilier";
    } else if (/^(gard_|poarta_|limit_|teren_cf|amprenta_|alee_|auto_|curte_)/.test(id)) {
      category = category || "amenajare_exterioara";
      site_layer =
        site_layer ||
        (id.startsWith("gard_") || id.startsWith("poarta_") || id.startsWith("limit_")
          ? "imprejmuire"
          : id.startsWith("alee_") || id.startsWith("auto_") || id.startsWith("curte_")
            ? "curte"
            : "curte");
    } else if (/^(acoperis_apa_|acoperis_fronton_|acoperis_sofit_|acoperis_plafon_|pv_)/.test(id)) {
      category = category || "acoperis";
      site_layer = site_layer || "finisaj";
    } else if (/^(parapet_)/.test(id)) {
      category = category || "zidarie";
      site_layer = site_layer || "anvelopa";
    } else if (/^(terasa_|guard_paravan_)/.test(id)) {
      category = category || "finisaj";
      site_layer = site_layer || "finisaj";
    } else if (/^(extract_|stack_|prana_|ac_)/.test(id)) {
      category = category || "mep";
      site_layer = site_layer || "finisaj";
    } else if (id === "subsol_prag_usa_magazie") {
      category = category || "structura";
      site_layer = site_layer || "structura";
    }
  }

  if (!site_layer) site_layer = "necunoscut";
  if (!category) category = site_layer === "necunoscut" ? "necunoscut" : site_layer;

  m.site_layer = site_layer;
  m.category = category;
  m.level = level;
  return m;
}

export function enrichVolume(volume) {
  let filled = 0;
  for (const m of volume.meshes || []) {
    const before = m.site_layer;
    enrichMeshMeta(m);
    if (!before && m.site_layer && m.site_layer !== "necunoscut") filled++;
  }
  volume.meta = volume.meta || {};
  volume.meta.layers_enriched = true;
  volume.meta.layers_enriched_at = new Date().toISOString();
  return { volume, filled, total: (volume.meshes || []).length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rel = process.argv[2] || "viewer/data/volume_a1.json";
  const abs = path.join(root, rel);
  const volume = JSON.parse(fs.readFileSync(abs, "utf8"));
  const { filled, total } = enrichVolume(volume);
  fs.writeFileSync(abs, JSON.stringify(volume, null, 2));
  // mirror curat if present
  const curat = path.join(root, "outputs/plans/04_volume_a1_curat.json");
  if (rel.includes("volume_a1") && fs.existsSync(curat)) {
    fs.writeFileSync(curat, JSON.stringify(volume, null, 2));
  }
  console.log(JSON.stringify({ ok: true, file: rel, filled, total }, null, 2));
}

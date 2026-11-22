// Exports the app's body mesh, sample-timeline shapes and heatmaps for /3d
// (public/body3d/ and src/lib/body3d-data.json). Run from body-comp-app:
//   cp scripts/export_body3d.dart ../body-comp-app/packages/body_mapping/tool/
//   cd ../body-comp-app/packages/body_mapping && dart run tool/export_body3d.dart /tmp/body3d
// then convert index.bin to Uint16 and copy the files over (see the PR).
// TEMPORARY: exports the app's body + sample-timeline shapes/colors for the website.
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:body_mapping/body_mapping.dart';
import 'package:body_mapping/fixtures.dart';

void main(List<String> args) {
  final out = Directory(args.first)..createSync(recursive: true);
  final asset = BodyAsset.parse(
    File('lib/assets/body.glb').readAsBytesSync(),
  );
  final mapper = DexaBodyMapper(asset);
  final s = sampleTimeline;
  void w(String name, TypedData d) => File('${out.path}/$name')
      .writeAsBytesSync(d.buffer.asUint8List(d.offsetInBytes, d.lengthInBytes));

  final pair = mapper.pairWeights(s.first, s.last);
  w('pos_from.bin', mapper.geometryFor(pair.from).positions);
  w('pos_to.bin', mapper.geometryFor(pair.to).positions);
  w('index.bin', asset.indices);
  final m = Uint8List(asset.masks.length);
  for (var i = 0; i < m.length; i++) {
    m[i] = (asset.masks[i].clamp(0, 1) * 255).round();
  }
  w('masks.bin', m);
  Uint8List col(RegionColors c) {
    final f = c.bake(asset);
    final o = Uint8List(asset.vertexCount * 3);
    for (var v = 0; v < asset.vertexCount; v++) {
      for (var j = 0; j < 3; j++) {
        o[v * 3 + j] = (f[v * 4 + j].clamp(0, 1) * 255).round();
      }
    }
    return o;
  }

  w('col_fat.bin', col(mapper.colorsFor(s.last, s.last, HeatMetric.fatPct)));
  w('col_fatchange.bin',
      col(mapper.colorsFor(s.first, s.last, HeatMetric.fatChange)));
  w('col_leanchange.bin',
      col(mapper.colorsFor(s.first, s.last, HeatMetric.leanChange)));

  Map<String, Object?> scan(BodyScan b) => {
    'date': b.scannedAt.toIso8601String().substring(0, 10),
    'bodyFatPct': b.bodyFatPct,
    'leanKg': b.totalLeanKg,
    'fatKg': b.totalFatKg,
    'visceralG': b.visceralFatG,
    'regions': {
      for (final r in BodyRegion.values)
        r.name: {
          'leanKg': b.regions[r]!.leanKg,
          'fatKg': b.regions[r]!.fatKg,
          'fatPct': b.regions[r]!.fatPct,
        },
    },
    'bands': {
      for (final e in b.bands.entries)
        e.key.name: {
          'leanKg': e.value.leanKg,
          'fatKg': e.value.fatKg,
          'fatPct': e.value.fatPct,
        },
    },
  };
  String hex(Rgb c) => '#${[c.r, c.g, c.b].map((x) => (x * 255).round().toRadixString(16).padLeft(2, '0')).join()}';
  File('${out.path}/body.json').writeAsStringSync(
    const JsonEncoder.withIndent(' ').convert({
      'vertexCount': asset.vertexCount,
      'maskSlots': MaskSlot.count,
      'scans': [for (final b in s) scan(b)],
      'legend': {
        for (final h in HeatMetric.values)
          h.name: [
            for (final st in mapper.legend(h, Sex.male))
              {'value': st.value, 'color': hex(st.color)},
          ],
      },
    }),
  );
  stdout.writeln('verts ${asset.vertexCount} tris ${asset.triangleCount}');
}

We have all translation in 'compressed_translation_simple' folder. you also need to decompressed then to use. 

In recitations.json we have segments_url that will give back the compressed and encoded text. You need to decode it. we used this code in dart to decompressed :

```dart
String decodeBZip2String(String compressedText) {
  final compressedBytes = base64.decode(compressedText);
  final decompressedBytes = BZip2Decoder().decodeBytes(compressedBytes);
  return utf8.decode(decompressedBytes);
}
```

To use surah-name-v1.ttf fonts you need to see this code used in flutter app:

```dart
Text(
  "surah${surahNumber.toString().padLeft(3, '0')}",
  style: TextStyle(
    fontFamily: "surah-name-v1",
    fontSize: 22,
    color: isDark ? Colors.white : Colors.grey.shade900,
  ),
);
```

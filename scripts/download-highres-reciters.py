import os
import json
import urllib.request
import ssl
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

OUTPUT_DIR = os.path.join(os.getcwd(), 'reciter_images')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 39 Unique Reciters mapped to high-resolution portrait URLs
RECITER_MAP = {
    'Mishari Rashid Alafasy': {
        'slug': 'mishari-rashid-alafasy',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/2/24/%D0%9C%D0%B8%D1%88%D0%B0%D1%80%D0%B8_%D0%A0%D0%B0%D1%88%D0%B8%D0%B4.jpg',
        'fallback_url': 'https://media.way2quran.com/imgs/mishary-alafasy.webp',
        'ext': 'jpg'
    },
    'Abdul Basit Abdus Samad': {
        'slug': 'abdul-basit-abdus-samad',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/5/59/Abdul_Basit_Abd_us-Samad_in_South_Africa_in_1966_01.jpg',
        'fallback_url': 'https://media.way2quran.com/imgs/abdul-basit-abdul-samad.jpg',
        'ext': 'jpg'
    },
    'Abdullah Basfar': {
        'slug': 'abdullah-basfar',
        'url': 'https://media.way2quran.com/imgs/abdullah-basfar.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/abdullah-ibn-ali-basfar.png',
        'ext': 'jpg'
    },
    'Abdur-Rahman as-Sudais': {
        'slug': 'abdur-rahman-as-sudais',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Abdul-Rahman_Al-Sudais_%28Cropped%2C_2011%29.jpg',
        'fallback_url': 'https://media.way2quran.com/imgs/abdul-rahman-al-sudais.jpg',
        'ext': 'jpg'
    },
    'Abu Bakr al-Shatri': {
        'slug': 'abu-bakr-al-shatri',
        'url': 'https://media.way2quran.com/imgs/abu-bakr-al-shatri.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/abu-bakr-al-shatri.png',
        'ext': 'jpg'
    },
    'Ahmed ibn Ali al-Ajamy': {
        'slug': 'ahmed-ibn-ali-al-ajamy',
        'url': 'https://media.way2quran.com/imgs/ahmed-al-agamy.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/ahmed-al-ajmi.png',
        'ext': 'jpg'
    },
    'Saad Al-Ghamdi': {
        'slug': 'saad-al-ghamdi',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/4/43/Saad_al_Ghamdi.jpg',
        'fallback_url': 'https://media.way2quran.com/imgs/saad-al-ghamdi.jpg',
        'ext': 'jpg'
    },
    'Hani ar-Rifai': {
        'slug': 'hani-ar-rifai',
        'url': 'https://media.way2quran.com/imgs/hani-al-rifai.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/hani-ar-rifai.png',
        'ext': 'jpg'
    },
    'Mahmoud Khalil Al-Husary': {
        'slug': 'mahmoud-khalil-al-husary',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Hussary.jpg',
        'fallback_url': 'https://media.way2quran.com/imgs/mahmoud-khalil-al-hosary.jpg',
        'ext': 'jpg'
    },
    'Ali Al-Hudhaify': {
        'slug': 'ali-al-hudhaify',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Ali_al-Hudhayfi.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/ali-al-hudhaify.jpg',
        'ext': 'jpg'
    },
    'Ibrahim Akhdar': {
        'slug': 'ibrahim-akhdar',
        'url': 'https://media.way2quran.com/imgs/ibrahim-al-akhdar.jpeg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/ibrahim-al-akhdar.png',
        'ext': 'jpg'
    },
    'Maher Al Muaiqly': {
        'slug': 'maher-al-muaiqly',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Maher_Al_Mueaqly.jpg',
        'fallback_url': 'https://media.way2quran.com/imgs/maher-almaikulai.jpg',
        'ext': 'jpg'
    },
    'Mohamed Siddiq al-Minshawi': {
        'slug': 'mohamed-siddiq-al-minshawi',
        'url': 'https://media.way2quran.com/imgs/muhammad-siddiq-al-minshawi.jpg',
        'fallback_url': 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Elminshwey.jpg',
        'ext': 'jpg'
    },
    'Muhammad Ayyoub': {
        'slug': 'muhammad-ayyoub',
        'url': 'https://media.way2quran.com/imgs/mohamed-ayoub.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/muhammad-ayyoub.jpg',
        'ext': 'jpg'
    },
    'Muhammad Jibreel': {
        'slug': 'muhammad-jibreel',
        'url': 'https://media.way2quran.com/imgs/muhammad-jibril.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/muhammad-jebril.png',
        'ext': 'jpg'
    },
    'Mustafa Ismail': {
        'slug': 'mustafa-ismail',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/5/55/Mostafa_Ismaeel.jpg',
        'fallback_url': 'https://media.way2quran.com/imgs/mustafa-ismail.jpg',
        'ext': 'jpg'
    },
    "Sa'ud ash-Shuraym": {
        'slug': 'saud-ash-shuraym',
        'url': 'https://media.way2quran.com/imgs/saud-al-shuraim.jpg',
        'fallback_url': 'https://upload.wikimedia.org/wikipedia/commons/1/1e/The_IMAM_of_Holy_Mosque_in_Makka_Al_Mukarramah%2C_Saudi_Arabia%2C_Sheikh_Dr._Saud_Bin_Ibrahem_Al_Shuraim_meeting_the_Vice_President%2C_Shri_Mohd._Hamid_Ansari%2C_in_New_Delhi_on_March_03%2C_2012_%28cropped%29.jpg',
        'ext': 'jpg'
    },
    'Salah Bukhatir': {
        'slug': 'salah-bukhatir',
        'url': 'https://media.way2quran.com/imgs/salah-boukhatir.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/salah-bukhatir.png',
        'ext': 'jpg'
    },
    'Muhsin Al Qasim': {
        'slug': 'muhsin-al-qasim',
        'url': 'https://media.way2quran.com/imgs/abdul-mohsen-al-qasim.jpeg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/abdulmohsen-al-qasim.png',
        'ext': 'jpg'
    },
    'Abdullah Awad Al-Juhani': {
        'slug': 'abdullah-awad-al-juhani',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Abdullah_Al_Juhany_%28Cropped%29.png',
        'fallback_url': 'https://media.way2quran.com/imgs/abdullah-al-juhani.jpg',
        'ext': 'png'
    },
    'Salah Al Budair': {
        'slug': 'salah-al-budair',
        'url': 'https://media.way2quran.com/imgs/salah-al-badir.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/salah-al-budair.png',
        'ext': 'jpg'
    },
    'Abdullah Matroud': {
        'slug': 'abdullah-matroud',
        'url': 'https://media.way2quran.com/imgs/abdullah-al-matroud.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/abdullah-matroud.jpg',
        'ext': 'jpg'
    },
    'Ahmed Nuaina': {
        'slug': 'ahmed-nuaina',
        'url': 'https://media.way2quran.com/imgs/ahmed-nainaa.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/ahmed-nuinaa.png',
        'ext': 'jpg'
    },
    'Muhammad AbdulKareem': {
        'slug': 'muhammad-abdulkareem',
        'url': 'https://media.way2quran.com/imgs/mohammad-abd-al-kareem.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/muhammad-abdulkareem.png',
        'ext': 'jpg'
    },
    'Khalifa Al-Tunaiji': {
        'slug': 'khalifa-al-tunaiji',
        'url': 'https://media.way2quran.com/imgs/khalifa-al-taniji.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/khalifa-al-tunaiji.png',
        'ext': 'jpg'
    },
    'Mahmoud Ali Al-Banna': {
        'slug': 'mahmoud-ali-al-banna',
        'url': 'https://media.way2quran.com/imgs/mahmoud-ali-al-banna.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/mahmud-ali-al-banna.png',
        'ext': 'jpg'
    },
    'Ibrahim Al-Dosary': {
        'slug': 'ibrahim-al-dosary',
        'url': 'https://media.way2quran.com/imgs/ibrahim-al-dosari.png',
        'fallback_url': 'https://way2quran.com/_next/image?url=https%3A%2F%2Fstorage.googleapis.com%2Fway2quran_storage%2Fimgs%2Fibrahim-al-dosari.png&w=640&q=75',
        'ext': 'png'
    },
    'Yassin Al-Jazaery': {
        'slug': 'yassin-al-jazaery',
        'url': 'https://media.way2quran.com/imgs/yassin-al-jazairi.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/al-qari-yassen.png',
        'ext': 'jpg'
    },
    'Khalid Abdullah al-Qahtani': {
        'slug': 'khalid-abdullah-al-qahtani',
        'url': 'https://media.way2quran.com/imgs/khalid-al-qahtani.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/khaled-al-qahtani.png',
        'ext': 'jpg'
    },
    'Yasser Ad-Dussary': {
        'slug': 'yasser-ad-dussary',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Yasser_Al-Dosari_%28cropped%29.jpg',
        'fallback_url': 'https://media.way2quran.com/imgs/yasser-al-dosary.jpg',
        'ext': 'jpg'
    },
    'Nasser Al Qatami': {
        'slug': 'nasser-al-qatami',
        'url': 'https://media.way2quran.com/imgs/naser-al-katamy.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/nasser-al-qatami.png',
        'ext': 'jpg'
    },
    'Sahl Yassin': {
        'slug': 'sahl-yassin',
        'url': 'https://media.way2quran.com/imgs/sahl-yassin.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/sahl-yassin.png',
        'ext': 'jpg'
    },
    'Aziz Alili': {
        'slug': 'aziz-alili',
        'url': 'https://www.assabile.com/media/person/200x256/aziz-alili.jpg',
        'fallback_url': '',
        'ext': 'jpg'
    },
    'Yaser Salamah': {
        'slug': 'yaser-salamah',
        'url': 'https://media.way2quran.com/imgs/yasser-salama.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/yasser-salama.jpg',
        'ext': 'jpg'
    },
    'Akram Al Alaqimy': {
        'slug': 'akram-al-alaqimy',
        'url': 'https://media.way2quran.com/imgs/akram-al-alaqmi.jpeg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/akram-al-aalakmi.png',
        'ext': 'jpg'
    },
    'Ali Jaber': {
        'slug': 'ali-jaber',
        'url': 'https://media.way2quran.com/imgs/ali-jaber.jpg',
        'fallback_url': 'https://static.qurancdn.com/images/reciters/23/Abdullah-Ali-Jabir-profile.png?v=1',
        'ext': 'jpg'
    },
    'Fares Abbad': {
        'slug': 'fares-abbad',
        'url': 'https://media.way2quran.com/imgs/fares-abbad.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/fares-abbad.png',
        'ext': 'jpg'
    },
    'Ayman Sowaid': {
        'slug': 'ayman-sowaid',
        'url': 'https://media.way2quran.com/imgs/ayman-sweid.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/ayman-swid.jpg',
        'ext': 'jpg'
    },
    'Mohamed al-Tablawi': {
        'slug': 'mohamed-al-tablawi',
        'url': 'https://media.way2quran.com/imgs/muhammad-mahmoud-al-tablawi.jpg',
        'fallback_url': 'https://www.assabile.com/media/person/200x256/mohamed-tablawi.png',
        'ext': 'jpg'
    },
}

print(f'Starting collection of {len(RECITER_MAP)} high-resolution reciter portraits...')

manifest = {}
success_count = 0

for name, item in RECITER_MAP.items():
    slug = item['slug']
    ext = item.get('ext', 'jpg')
    target_file = f"{slug}.{ext}"
    target_path = os.path.join(OUTPUT_DIR, target_file)
    
    downloaded = False
    
    # Try primary URL
    for candidate_url in [item['url'], item.get('fallback_url')]:
        if not candidate_url:
            continue
        try:
            req = urllib.request.Request(candidate_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
                data = resp.read()
                if len(data) > 1000:
                    with open(target_path, 'wb') as f_out:
                        f_out.write(data)
                    downloaded = True
                    break
        except Exception as e:
            time.sleep(0.3)
            continue
            
    if downloaded and os.path.exists(target_path):
        size_kb = os.path.getsize(target_path) / 1024
        print(f'✅ [{success_count+1:2d}/39] {name} -> {target_file} ({size_kb:.1f} KB)')
        manifest[name] = {
            'slug': slug,
            'file': target_file,
            'relativePath': f'reciter_images/{target_file}',
            'sizeBytes': os.path.getsize(target_path),
        }
        success_count += 1
    else:
        print(f'❌ Failed to download: {name}')

manifest_path = os.path.join(OUTPUT_DIR, 'manifest.json')
with open(manifest_path, 'w', encoding='utf-8') as f_m:
    json.dump(manifest, f_m, indent=2, ensure_ascii=False)

print(f'\nDownload complete! Successfully saved {success_count}/39 images into {OUTPUT_DIR}/')
print(f'Saved manifest to {manifest_path}')

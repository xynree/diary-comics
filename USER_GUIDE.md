# 👤 User Guide - Diary Comics Website

*A simple guide for adding and viewing your diary comics*

## 🎯 What This Website Does

Your diary comics website automatically displays your comic images in a beautiful, organized gallery. Just add images to a special folder, and they appear on your website within seconds!

## 📱 Viewing Your Comics

### **🌐 Accessing Your Website**
- **Development**: http://localhost:3000 (when running locally)
- **Production**: https://your-site.vercel.app (your live website)

### **🖼️ Gallery Features**

#### **Main Gallery View**
- **Scroll Down**: More comics load automatically as you scroll
- **Date Organization**: Comics are grouped by the date they were created
- **Multiple Images**: If you have multiple comics for one day, they appear in a horizontal row

#### **Full-Screen Viewing**
- **Click Any Image**: Opens it in full-screen mode
- **Navigate**: Use arrow keys or click arrows to see next/previous images
- **Close**: Click the X or press Escape to return to gallery
- **Mobile**: Swipe left/right to navigate between images

#### **Mobile Experience**
- **Touch Friendly**: Tap to open images, swipe to navigate
- **Responsive**: Automatically adjusts to your screen size
- **Fast Loading**: Images load quickly even on slower connections

## 📁 Adding New Comics

### **🎨 Preparing Your Images**

#### **File Naming Rules** ⚠️ **IMPORTANT**
Your image files must be named in this exact format: `M.D.YY_sequence.jpg`

**Examples:**
- `1.1.24_1.jpg` → January 1st, 2024, first image
- `12.25.24_2.png` → December 25th, 2024, second image
- `3.15.23_1.jpeg` → March 15th, 2023, first image

**Breakdown:**
- `M` or `MM` = Month (1-12, can be 1 or 2 digits)
- `D` or `DD` = Day (1-31, can be 1 or 2 digits)  
- `YY` = Year (2 digits: 24 = 2024, 23 = 2023, etc.)
- `_` = Underscore (required separator)
- `sequence` = Number for multiple images per day (1, 2, 3, etc.)
- `.jpg/.png/.gif` = File extension

#### **Supported File Types**
- ✅ JPG/JPEG (recommended)
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ✅ BMP
- ✅ TIFF

#### **File Size Guidelines**
- **Minimum**: 1KB (very small files are rejected)
- **Maximum**: 10MB per file
- **Recommended**: 500KB - 2MB for best performance

### **📂 Upload Methods**

#### **Method 1: Automatic Upload (Recommended)**
1. **Find Your Upload Folder**:
   - Default: `~/Library/Mobile Documents/com~apple~CloudDocs/diary-images/`
   - This is your iCloud Drive folder for diary images

2. **Add Images**:
   - Simply drag and drop your properly named images into this folder
   - Or copy/paste them from anywhere on your computer

3. **Wait for Upload**:
   - Images upload automatically within 1-10 seconds
   - You'll see them appear on your website shortly after

#### **Method 2: Manual Upload**
If automatic upload isn't working:

1. **Open Terminal** (on Mac: Applications → Utilities → Terminal)
2. **Navigate to your project folder**:
   ```bash
   cd path/to/your/diary-comics
   ```
3. **Upload specific files**:
   ```bash
   npm run upload path/to/your/image.jpg
   ```
4. **Upload entire folder**:
   ```bash
   npm run upload path/to/your/images/folder
   ```

### **✅ Upload Success Indicators**

#### **What You'll See**
- **Terminal Messages**: "Successfully uploaded [filename]"
- **Website Update**: New images appear in gallery within 30 seconds
- **No Duplicates**: Same images won't be uploaded twice

#### **If Upload Fails**
- **Check File Name**: Must follow exact naming format
- **Check File Size**: Must be between 1KB and 10MB
- **Check Internet**: Ensure stable internet connection
- **Try Again**: Sometimes a simple retry works

## 🔧 Common Tasks

### **📅 Organizing by Date**
- **Automatic**: Website automatically groups images by date
- **Multiple Per Day**: Use sequence numbers (1, 2, 3, etc.)
- **Chronological Order**: Newest images appear at the top

### **🔄 Updating Existing Comics**
- **Replace**: Upload new image with same date/sequence to replace
- **Add More**: Use next sequence number for same date
- **Delete**: Currently requires manual removal from Cloudinary

### **📱 Sharing Your Gallery**
- **Share URL**: Send your website link to friends/family
- **Social Media**: Screenshots work great for sharing individual comics
- **Print**: Use browser's print function for physical copies

## 🆘 Troubleshooting

### **❌ Images Not Appearing**

#### **Check File Names**
- Must be exactly: `M.D.YY_sequence.extension`
- Common mistakes:
  - `1-1-24_1.jpg` ❌ (dashes instead of dots)
  - `1.1.2024_1.jpg` ❌ (4-digit year)
  - `1.1.24-1.jpg` ❌ (dash instead of underscore)
  - `1.1.24_1` ❌ (missing file extension)

#### **Check File Location**
- Files must be in the correct upload folder
- Default: iCloud Drive → diary-images folder

#### **Check File Size**
- Too small (under 1KB): Won't upload
- Too large (over 10MB): Won't upload
- Corrupted files: Won't upload

### **🐌 Slow Loading**
- **Large Files**: Consider compressing images before upload
- **Internet Speed**: Slower connections take longer to load
- **Many Images**: Gallery loads in batches to stay fast

### **📱 Mobile Issues**
- **Touch Not Working**: Try refreshing the page
- **Images Too Small**: Pinch to zoom or tap for full-screen
- **Slow on Mobile**: Consider using WiFi instead of cellular

## 💡 Tips & Best Practices

### **🎨 Image Quality**
- **Resolution**: 1200-2000 pixels wide is ideal
- **Compression**: Use 80-90% quality when saving JPEGs
- **Format**: JPG for photos, PNG for graphics with text

### **📅 Dating Your Comics**
- **Consistent Dating**: Use the actual date you created the comic
- **Batch Uploads**: You can upload many images at once
- **Sequence Numbers**: Start with 1 for each new date

### **🔄 Workflow Suggestions**
1. **Create Comics**: Draw/scan your comics
2. **Name Files**: Follow the naming convention
3. **Save to Upload Folder**: Drop them in the watched folder
4. **Check Website**: Verify they appear correctly
5. **Share**: Send your website link to others

### **💾 Backup Strategy**
- **Keep Originals**: Don't delete your original files
- **Cloud Storage**: iCloud Drive provides automatic backup
- **Export**: Periodically download all images from Cloudinary

## 📞 Getting Help

### **🔍 Self-Help Resources**
1. **Check This Guide**: Most common issues are covered here
2. **Try Different Browser**: Sometimes browser-specific issues occur
3. **Refresh Page**: Simple refresh often fixes display issues
4. **Check Internet**: Ensure stable connection

### **🆘 When to Ask for Help**
- Images consistently fail to upload despite correct naming
- Website shows errors or won't load
- Upload system stops working entirely
- Need help with advanced configuration

### **📧 Contact Information**
- **Email**: your-email@example.com
- **Include**: Screenshots, error messages, and what you were trying to do
- **Response Time**: Usually within 24 hours

---

## 🎉 Enjoy Your Comics!

Your diary comics website is designed to be simple and automatic. Once set up, you should be able to:

1. **Create** your comics
2. **Name** them correctly  
3. **Drop** them in the folder
4. **View** them on your website
5. **Share** with others

The system handles everything else automatically - no technical knowledge required!

**Happy comic creating! 🎨**

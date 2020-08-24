//Названия папкок с исходниками и с готовой сборкой
let sourceFolder = "app/";
let projectFolder = require('path').basename(__dirname) + "/";

// Определяем переменную "preprocessor"
let preprocessor = 'scss'; 
 
// Определяем константы Gulp
const { src, dest, parallel, series, watch } = require('gulp');
 
// Подключаем Browsersync
const browserSync = require('browser-sync').create();
 
// Подключаем gulp-concat
const concat = require('gulp-concat');
 
// Подключаем gulp-uglify-es
const uglify = require('gulp-uglify-es').default;
 
// Подключаем модули gulp-sass и gulp-less
const scss = require('gulp-sass');

// Подключаем Autoprefixer
const autoprefixer = require('gulp-autoprefixer');
 
// Подключаем модуль gulp-clean-css
const cleancss = require('gulp-clean-css');
 
// Подключаем gulp-imagemin для работы с изображениями
const imagemin = require('gulp-imagemin');
 
// Подключаем модуль gulp-newer
const newer = require('gulp-newer');
 
// Подключаем модуль gulp-webp для конвертации в webp формат
const webp = require('gulp-webp');

// Подключаем модуль gulp-webp-html для автоматического подключения webp в html файл
const webphtml = require('gulp-webp-html');

// Подключаем модуль gulp-webpcss для автоматического подключения webp в css файл
//const webpcss = require('gulp-webpcss');

// Подключаем модуль del
const del = require('del');

//Подключаем модуль gulp-file-include
const fileInclude = require('gulp-file-include');

//Подключаем модули gulp-ttf2woff, gulp-ttf2woff2 и gulp-fonter для конвертации шрифтов
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');



// Определяем логику работы Browsersync
function browsersync() {
	browserSync.init({ // Инициализация Browsersync
		server: { baseDir: projectFolder }, // Указываем папку сервера
		notify: false, // Отключаем уведомления
		online: true // Режим работы: true или false
	})
}
 

function html() {
	return src([sourceFolder + '*.html', '!' + sourceFolder + '_*.html'])
	.pipe(fileInclude())
	.pipe(webphtml())
	.pipe(dest(projectFolder))
}


function scripts() {
	return src([ // Берём файлы из источников
		'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
		sourceFolder + 'js/script.js', // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
		])
	.pipe(concat('script.min.js')) // Конкатенируем в один файл
	.pipe(uglify()) // Сжимаем JavaScript
	.pipe(dest(projectFolder + 'js/')) // Выгружаем готовый файл в папку назначения
	.pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы
}
 

function styles() {
	return src(sourceFolder + preprocessor + '/style.' + preprocessor + '') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
	.pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
	.pipe(concat('style.min.css')) // Конкатенируем в файл app.min.js
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], cascade: true, grid: true })) // Создадим префиксы с помощью Autoprefixer
	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Минифицируем стили
	.pipe(dest(projectFolder + 'css/')) // Выгрузим результат в папку "app/css/"
	.pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}
 

function images() {
	return src(sourceFolder + 'img/**/*') // Берём все изображения из папки источника
	.pipe( 
		webp({
			quality: 70
		})
	)//Конвертация в формат webp
	.pipe(dest(projectFolder + 'img/')) // Выгружаем конвертированные изображения в папку назначения
	.pipe(src(sourceFolder + 'img/**/*'))
	.pipe(newer(sourceFolder + 'img/**/*')) // Проверяем, было ли изменено (сжато) изображение ранее
	.pipe(imagemin([
		imagemin.gifsicle({interlaced: true}),
	    imagemin.mozjpeg({progressive: true}),
	    imagemin.optipng({optimizationLevel: 3}),
	    imagemin.svgo({
	        plugins: [
	            {removeViewBox: false},
	            {cleanupIDs: false}
	        ]
	    })
	])) // Сжимаем и оптимизируем изображеня)) 
	.pipe(dest(projectFolder + 'img/')) // Выгружаем оптимизированные изображения в папку назначения
	.pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}


//Конвертируем и выгружаем шрифты
function fonts() {
	 src(sourceFolder + 'fonts/*.ttf')
	.pipe(ttf2woff())
	.pipe(dest(projectFolder + 'fonts/'))
	return src(sourceFolder + 'fonts/*.ttf')
	.pipe(ttf2woff2())
	.pipe(dest(projectFolder + 'fonts/'))

}


//Конвертируем шрифты из OTF в TTF
function otf2ttf() {
	return src([sourceFolder + 'fonts/*.otf'])
	.pipe(fonter({
		formats: ['ttf']
	}))
	.pipe(dest(sourceFolder + 'fonts/'));
}


function cleanimg() {
	return del(projectFolder + 'img/**/*', { force: true }) // Удаляем всё содержимое папки "app/images/"
}
 

function buildcopy() {
	return src([ // Выбираем нужные файлы
		sourceFolder + 'css/**/*.min.css',
		sourceFolder + 'js/**/*.min.js',
		sourceFolder + 'img/dest/**/*',
		sourceFolder + 'fonts/**/*',
		sourceFolder + '**/*.html',
		], { base: sourceFolder }) // Параметр "base" сохраняет структуру проекта при копировании
	.pipe(dest(projectFolder)) // Выгружаем в папку с финальной сборкой
}
 

function cleandist() {
	return del(projectFolder + '**/*', { force: true }) // Удаляем всё содержимое папки "dist/"
}
 

function startwatch() {
 
	// Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
	watch([sourceFolder + '**/*.js', '!' + sourceFolder + '**/*.min.js'], scripts);
	
	// Мониторим файлы препроцессора на изменения
	watch(sourceFolder + '**/' + preprocessor + '/**/*', styles);
 
	// Мониторим файлы HTML на изменения
	watch(sourceFolder + '**/*.html').on('change', browserSync.reload);
	watch(sourceFolder + '**/*.html').on('change', html);
 
	// Мониторим папку-источник изображений и выполняем images(), если есть изменения
	watch(sourceFolder + 'img/**/*', cleanimg);
	watch(sourceFolder + 'img/**/*', images);
 
}
 


// Экспортируем функцию browsersync() как таск browsersync. Значение после знака = это имеющаяся функция.
exports.browsersync = browsersync;

//Экспортируем функцию html() в такск html
exports.html = html;
 
// Экспортируем функцию scripts() в таск scripts
exports.scripts = scripts;
 
// Экспортируем функцию styles() в таск styles
exports.styles = styles;
 
// Экспорт функции images() в таск images
exports.images = images;

// Экспорт функции fonts() в таск fonts
exports.fonts = fonts;

// Экспорт функции otf2ttf() в таск otf2ttf
exports.otf2ttf = otf2ttf;
 
// Экспортируем функцию cleanimg() как таск cleanimg
exports.cleanimg = cleanimg;
 
// Создаём новый таск "build", который последовательно выполняет нужные операции
exports.build = series(cleandist, styles, scripts, images, buildcopy);
 
// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(cleandist, html, styles, scripts, images, fonts, browsersync, startwatch);
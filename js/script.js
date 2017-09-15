(function(){

    'use strict';
    
    var shops = [];
    
    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
    
    window.requestFileSystem(TEMPORARY, 5*1024*1024 /*5MB*/, onInitFs, errorHandler);
    // window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024, function(grantedBytes) {
    //     window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
    // }, function(e) {
    //     console.log('Error', e);
    // });
    
    function onInitFs(fs) {
        console.log('Opend File System: ' + fs.name);
        
        fs.root.getFile('log.txt', {create: true/*, exclusive: true*/}, function(fileEntry) {
            console.log(fileEntry);
        }, errorHandler);
    }
    
    function errorHandler(e) {
        var msg = '';
        
        switch (e.code) {
            case e.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case e.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case e.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case e.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case e.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error';
                break;
                
        }
        
        console.log('Error: ' + msg);
    }
    
    
    document.addEventListener('DOMContentLoaded', function(e) {
        
        var drop = document.getElementById('drop');
        var xlf = document.getElementById('xlf');
        var outFormatted = document.getElementById('out-formatted');
        var outNoFormatted = document.getElementById('out-no-formatted');

        if (drop.addEventListener) {
            drop.addEventListener('dragenter', handleDragover, false);
            drop.addEventListener('dragover', handleDragover, false);
            drop.addEventListener('drop', handleDrop, false);
        }

        if (xlf.addEventListener) xlf.addEventListener('change', handleFile, false);
        
        /**
         * drop時
         * @param  {[type]} e [description]
         * @return {[type]}   [description]
         */
        function handleDrop(e) {
            
            e.stopPropagation();
            e.preventDefault();
            
            var files = e.dataTransfer.files;
            var f = files[0];
            
            outFileNames(files);
            convertAllFiles(files);
        }
        
        function handleDragover(e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
        
        /**
         * file選択時
         * @param  {[type]} e [description]
         * @return {[type]}   [description]
         */
        function handleFile(e) {
            var files = e.target.files;
            var f = files[0];
            
            outFileNames(files);
            convertAllFiles(files);
        }
        
        /**
         * Excel -> JSON変換
         * @param  {[type]} files [description]
         * @return {[type]}       [description]
         */
        function convertAllFiles(files) {
            
            async.each(files, function(file, callback) {
                
                readXSLXFile(file).then(function(data) {
                    
                    //shops = [...shops, ...data];
                    shops = shops.concat(data);
                    console.log(shops);
                    callback(null);
                });
                                
            }, function(err) {
                // if any of the file processing produced an error, err would equal that error
                if( err ) {
                  // One of the iterations produced an error.
                  // All processing will now stop.
                  console.log(err);
                } else {
                  console.log('All files have been processed successfully');
                  outShopsJson(shops);
                }
                
            });
            
        }
            
        /**
         * Excelの読み込み（複数ファイル対応のためPromiseを返却）
         * @param  {[type]} file [description]
         * @return {[type]}      [description]
         */
        function readXSLXFile(file) {
            
            return new Promise(function(resolve, reject) {
                var reader = new FileReader();
                var name = file.name;
                
                reader.onload = function(e) {
                    var data = e.target.result;
                    var arr = fixdata(data);
                                
                    var wb = XLSX.read(btoa(arr), {type: 'base64'});
                                                        
                    resolve(to_json(wb));
                };
                
                reader.onerror = function() {
                    reject(reader.error);
                };
                
                reader.readAsArrayBuffer(file);
            
            });
        }
        
        /**
         * excel -> json変換
         * @param  {[type]} workbook [description]
         * @return {[type]}          [description]
         */
        function to_json(workbook) {

            var result = [];
            
            workbook.SheetNames.forEach(function(sheetName, i) {
                var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                if (roa.length > 0) {
                    result = result.concat(roa);
                }
                
            });
            
            return result;
        }
            
        /**
         * 画面にjson出力
         * @param  {[type]} shop [description]
         * @return {[type]}      [description]
         */
        function outShopsJson(shop) {
            outFormatted.innerText = JSON.stringify(shops, null, 4);
            outNoFormatted.innerText = JSON.stringify(shops);
        }
        
        /**
         * ファイル名の表示
         * @param  {[type]} files [description]
         * @return {[type]}       [description]
         */
        function outFileNames(files) {
            
            var outNames = document.getElementById('out-filename');
            outNames.innerHTML = '';
            
            async.each(files, function(file) {
                var filename = document.createElement('li');
                filename.innerText = file.name;
                outNames.appendChild(filename); 
            });
            
        }

    });    

    function fixdata(data) {
    	var o = "", l = 0, w = 10240;
    	for(; l<data.byteLength/w; ++l) o+=String.fromCharCode.apply(null,new Uint8Array(data.slice(l*w,l*w+w)));
    	o+=String.fromCharCode.apply(null, new Uint8Array(data.slice(l*w)));
    	return o;
    }
    
    
    


})();
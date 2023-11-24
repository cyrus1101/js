const PLAYER_MUSIC = 'F8_PLAYER';
const playList = document.querySelector('.playlist');
const cdThumb = document.querySelector('.cd-thumb');
const cd = document.querySelector('.cd')
const heading = document.querySelector('header h2');
const audio = document.querySelector('#audio');
const playBtn = document.querySelector('.btn-toggle-play');
const player = document.querySelector('.player');
const progress = document.querySelector('.progress');
const nextBtn = document.querySelector('.btn-next');
const prevBtn = document.querySelector('.btn-prev');
const randomBtn = document.querySelector('.btn-random');
const repeatBtn = document.querySelector('.btn-repeat');
const volumeProgress = document.querySelector('#volume');
const volumeIcon = document.querySelector('.volume-icon');
const VolumeIconList = document.querySelectorAll('.volume-icon i');
const songsAPI = 'http://localhost:3000/songs'
const app = {
    currentIndex :0 ,
    lastSongIndex: null,
    isReloading:false,
    isPlaying : false,
    isRandom : false,
    isRepeat : false,
    isDragging: false,
    config : JSON.parse(localStorage.getItem(PLAYER_MUSIC)) || {},
    setConfig : function(key,value) {
        this.config[key] = value;
        localStorage.setItem(PLAYER_MUSIC, JSON.stringify(this.config))
    },
  
    getSongs : function(callBack) {
       return fetch(songsAPI) 
            .then(function(response) {
                    return response.json()
            })
            .then(callBack )
          
    },
    
   render : function(songs) {
    
        const htmls =songs.map(function(song,index) {
         
            return `
            <div data-index="${index}" class=" song ${index === app.currentIndex ? 'active' : ''} " >
            <div class="thumb" style="background-image: url('${song.image}')">
            </div>
            <div class="body">
              <h3 class="title">${song.name}</h3>
              <p class="author">${song.singer}</p>
            </div>
            <div class="option">
              <i class="fas fa-ellipsis-h"></i>
              <div class="option-wrap">
              <div class="option-del">
                xoá
              </div>
            </div>              
            </div>
          </div>`
        });
        playList.innerHTML = htmls.join('');
   },

 
   handlerEvents : function() {
    const _this = this;
    const cdWidth = cd.offsetWidth;    
    document.onscroll = function() {
        const scrollTop = document.documentElement.scrollTop ||window.scrollY;
        const cdNewWidth =   cdWidth - scrollTop;
        cd.style.width = cdNewWidth > 0 ?  cdNewWidth + 'px' : 0;    
        cd.style.opacity = cdNewWidth/cdWidth; 
    }
    const cdAnimate = cdThumb.animate([
        {transform: "rotate(360deg)"}
   ],
        {
            duration : 10000,
            iterations : Infinity
        }
    )
    cdAnimate.pause();
    playBtn.onclick = function() {
        if(_this.isPlaying) {
           audio.pause(); 
        } else {
            audio.play(); 
        }
    }
    audio.onplay = function() {
        _this.isPlaying = true ; 
        player.classList.add('playing');
        cdAnimate.play();
    }
    audio.onpause = function() {
        _this.isPlaying =false ; 
        player.classList.remove('playing');
        cdAnimate.pause();
    }
    // Cập nhật thời lượng hát 
    audio.ontimeupdate = function(e) {
        if(audio.duration) {
            const progressPercent = Math.floor(audio.currentTime / audio.duration * 100)
            progress.value = progressPercent;
            
         } 
     _this.setConfig('progressValue',progress.value);
     _this.setConfig('currentTime',audio.currentTime);
        }
        // Tua bài hát
    progress.oninput = function(e) {
        const seekTime = e.target.value * audio.duration / 100;
        audio.currentTime = seekTime;
      
    };
    nextBtn.onclick = function() {
       _this.isRandom ? _this.randomSong() : app.nextSong();
     
       _this.scrollToActive();
     _this.render

       audio.play();    
    },
    prevBtn.onclick = function() {
        _this.isRandom ? _this.randomSong() :  app.prevSong();
        _this.scrollToActive();
      _this.render

        audio.play();
    },
    randomBtn.onclick = function() {
        _this.isRandom = !_this.isRandom;
        _this.setConfig('isRandom',_this.isRandom);
       randomBtn.classList.toggle('active',_this.isRandom);
        _this.loadConfig();
        audio.pause();
    }
    repeatBtn.onclick = function() {
        _this.isRepeat = !_this.isRepeat;
        _this.setConfig('isRepeat',_this.isRepeat);
        repeatBtn.classList.toggle('active',_this.isRepeat);
        _this.loadConfig();
        audio.pause();
    }
    
    audio.onended = function() {
    if(_this.isRepeat) {
      audio.play();
    } else {
        nextBtn.click();
        audio.play();
    }
    }
  
    playList.onclick = function(e) {
        const songNode = e.target.closest('.song:not(.active)');
        const optionList = document.querySelectorAll('.option')
        const optionDels = document.querySelectorAll('.option-del');
        const optionWrapList = document.querySelectorAll('.option-wrap');
        if(songNode || e.target.closest('.option')) {
           if(songNode) {
           _this.currentIndex = Number(songNode.dataset.index);
           _this.render();
           _this.loadCurrentSong();
           audio.play();
            
        }
          // xu ly xoa bai hat
           if(e.target.closest('.option')) {
            optionList.forEach((option,index) => {
                const optionWrap = optionWrapList[index];
                const optionDel = optionDels[index];
                if(index === _this.currentIndex) {
                    option.onclick = function() {
                        optionWrap.classList.toggle('open');
                    }
                }
            })
           }
        } 
        
    }
   audio.volume =  Number(volumeProgress.value) / 100;
  volumeProgress.oninput = function(e) {
        audio.volume = Number(e.target.value) / 100; 
        
       VolumeIconList.forEach((iconActive, index) => {
        iconActive.classList.remove('active');
       })
       if(audio.volume > 0.8) {
        document.querySelector('.volume-icon i.high').classList.add('active');
    } else if(audio.volume == 0) {
        document.querySelector('.volume-icon i.off').classList.add('active');
    } else {
        document.querySelector('.volume-icon i.low').classList.add('active');
    }
    _this.setConfig("volume",e.target.value);
    _this.setConfig("progressPercent" , e.target.value)
  }
  
  volumeIcon.onclick = function(e) {
    if(audio.volume > 0) {
        audio.volume = 0;
        volumeProgress.value =0;
        VolumeIconList.forEach((iconActive) => {
            iconActive.classList.remove('active');
           })
        document.querySelector('.volume-icon i.off').classList.add('active');
    }else {
        audio.volume = Number(_this.config.volume) / 100;
        volumeProgress.value =_this.config.progressValue;
        _this.loadConfig();

      
        if(audio.volume > 0.8) {
            document.querySelector('.volume-icon i.high').classList.add('active');
        } else if(audio.volume == 0) {
            document.querySelector('.volume-icon i.off').classList.add('active');
        } else {
            document.querySelector('.volume-icon i.low').classList.add('active');
        }
        document.querySelector('.volume-icon i.off').classList.remove('active');
    } 

  }

   },
   nextSong : function(songs) {
    this.lastSongIndex = this.currentIndex;
    this.currentIndex++;
    console.log(songs.length)

    if(this.currentIndex > songs.length -1) {
        console.log(songs.length)

        this.currentIndex  =  0;
    };
    this.loadCurrentSong();
},
prevSong : function(songs) {
    

    this.lastSongIndex = this.currentIndex;
    this.currentIndex--;
    if(this.currentIndex < 0) {
        this.currentIndex  =  songs.length -1 ;
    };
    this.loadCurrentSong();
    
},

randomSong : function(songs) {
    

    this.lastSongIndex = this.currentIndex;
    let randomIndex; 
    do {
        randomIndex = Math.floor(Math.random() * songs.length);
    }while(randomIndex === this.currentIndex) 
    this.currentIndex = randomIndex;
    this.loadCurrentSong();
    this.getSongs(this.render)

},

defineProperties : function(songs) {
    const _this= this;
    Object.defineProperty(_this, 'currentSong', {
        get:function() {
            return songs[_this.currentIndex];
        }
    })
   },
   

loadCurrentSong :function() {
  
    app.setConfig('currentIndex', app.currentIndex); 
    app.setConfig('lastIndexOfSong',app.lastSongIndex);
   app.loadConfig()
    window.onload = function() {
        app.isReloading =true;
    }
    heading.textContent = app.currentSong.name;
    cdThumb.style.backgroundImage = `url(${app.currentSong.image})`;
    audio.src = app.currentSong.path;

    if(!this.isReloading || this.currentIndex !== this.lastSongIndex) {
        // Nếu người dùng không đang tải lại trang và có chuyển bài hát, đặt lại progress.value và audio.currentTime về 0
        progress.value = 0;
        audio.currentTime = 0;
      
    } else if (this.isReloading) {
        // Nếu người dùng đang tải lại trang, giữ nguyên progress.value và audio.currentTime
       
        progress.value = this.config.progressValue;
        audio.currentTime = this.config.currentTime;
      
    }
    

    
},  
loadConfig : function() {
    
    this.isRandom = this.config.isRandom;
    this.isRepeat = this.config.isRepeat;
    audio.volume = Number(this.config.volume) / 100;
    volumeProgress.value = this.config.progressPercent;
    this.currentSong = this.config.currentSong;
    progress.value = this.config.progressValue;
    audio.currentTime = this.config.currentTime;
    this.currentIndex = this.config.currentIndex ;
  this.lastSongIndex = this.config.lastIndexOfSong;

},    

scrollToActive : function() {
    setTimeout(() => {
        const songActive = document.querySelector('.song.active');
        if(songActive){
            songActive.scrollIntoView({
                behavior:'smooth',
                block: this.currentIndex <3 ? 'center' : 'nearest',
            })
        }
  },300)  
},
start : function() {
    this.loadConfig();
    this.getSongs(this.render);
    this.getSongs(this.loadCurrentSong);
    this.getSongs(this.handlerEvents);
    randomBtn.classList.toggle('active',this.config.isRandom);
    repeatBtn.classList.toggle('active',this.config.isRepeat);
    audio.volume = Number(this.config.volume) / 100;
    this.loadConfig();
}

}
app.start();

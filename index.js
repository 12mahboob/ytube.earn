document.addEventListener('DOMContentLoaded', function () {
    let balance = parseFloat(localStorage.getItem('balance')) || 0;
    const rewardAmount = 2;
    const hourlyBonus = 20;
    const dailyBonusAmount = 100;
    const watchTime = 20; // 20 seconds in milliseconds
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    let activeContainers = 0;

    const newLinks = [];
    const links = [
        "https://www.youtube.com/embed/TLq4VK01Rgc",
        "https://www.youtube.com/embed/1BZGJlquHy8",
        "https://www.youtube.com/embed/pK_xjAn8iOk",
        "https://www.youtube.com/embed/4RSTupbfGog",
        "https://www.youtube.com/embed/-sZQuUYEt2o"
    ];

    for (let i = 0; i < 5000; i++) {
        newLinks.push(links[i % links.length]); // Cyclically repeat links
    }

    function updateBalance(amount) {
        balance += amount;
        localStorage.setItem('balance', balance.toFixed(2));
        displayBalance();
    }

    function displayBalance() {
        const balanceElem = document.getElementById("balance");
        if (balanceElem) {
            balanceElem.textContent = balance.toFixed(2);
        }
    }

    function createYouTubeButtons() {
        const container = document.getElementById('earning-buttons');
        if (!container) return;

        container.innerHTML = '';

        newLinks.forEach((_link, index) => {
            const button = document.createElement("button");
            button.textContent = `Earn ${rewardAmount} PKR - Video ${index + 1}`;
            button.className = "btn-earn";
            button.id = `video-btn-${index}`;

            const lastClickDate = localStorage.getItem(`lastClickDate_${index}`);
            if (lastClickDate) {
                const lastClickTime = new Date(lastClickDate).getTime();
                const currentTime = new Date().getTime();
                const midnight = new Date();
                midnight.setHours(24, 0, 0, 0);

                if (currentTime < midnight.getTime() && currentTime - lastClickTime < oneDayInMilliseconds) {
                    button.disabled = true;
                    button.style.display = "none";
                }
            }

            button.onclick = () => {
                if (activeContainers === 0) {
                    openVideoContainer(index);
                    localStorage.setItem(`lastClickDate_${index}`, new Date().toISOString());
                    button.disabled = true;
                }
            };

            container.appendChild(button);
        });

        resetButtonsAtMidnight();
    }

    function resetButtonsAtMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight = midnight.getTime() - now.getTime();

        setTimeout(() => {
            newLinks.forEach((link, index) => {
                localStorage.removeItem(`lastClickDate_${index}`);
            });
            createYouTubeButtons();
        }, timeUntilMidnight);
    }

    function openVideoContainer(startIndex) {
        const videoContainers = document.getElementById('video-containers');
        if (!videoContainers) return;

        const existingContainer = document.querySelector('.video-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const videoContainer = document.createElement('div');
        videoContainer.className = "video-container";

        const playerId = `player-${startIndex}`;
        videoContainer.innerHTML = `
            <div class="video-header flex justify-between items-center mb-2 w-full">
                <h3 class="text-md font-bold text-white">Watch Ad to Earn</h3>
                <button class="close-btn text-white font-bold bg-red-500 hover:bg-red-700 rounded p-2">Close</button>
            </div>
            <div id="${playerId}"></div>
            <div class="counter text-center text-md font-bold my-2 text-white">20</div>
            <div class="progress-bar-container w-full bg-gray-700 rounded h-2 my-2">
                <div class="progress-bar bg-green-500 h-2 rounded" style="width: 100%;"></div>
            </div>
        `;

        const closeButton = videoContainer.querySelector('.close-btn');
        const counter = videoContainer.querySelector('.counter');
        const progressBar = videoContainer.querySelector('.progress-bar');

        let interval;
        let remainingTime = watchTime / 1; // Convert to seconds
        let currentIndex = startIndex;
        let player;

        function createPlayer() {
            player = new YT.Player(playerId, {
                height: '200',
                width: '100%',
                videoId: extractVideoId(newLinks[currentIndex]),
                playerVars: {
                    'autoplay': 1,
                    'controls': 1,
                    'rel': 0,
                    'showinfo': 1,
                    'modestbranding': 1,
                    'mute': 1,
                    'enablejsapi': 1
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        }

        function onPlayerReady(event) {
            event.target.playVideo();
            startCountdown();
        }

        function onPlayerStateChange(event) {
            if (event.data == YT.PlayerState.ENDED) {
                playNextVideo();
            }
        }

        function playNextVideo() {
            if (currentIndex >= newLinks.length) {
                closeVideoContainer();
                return;
            }

            player.loadVideoById(extractVideoId(newLinks[currentIndex]));
            remainingTime = watchTime / 1000; // Reset remaining time
            startCountdown();
        }

        function startCountdown() {
            clearInterval(interval);
            counter.textContent = `${remainingTime}s`;

            interval = setInterval(() => {
                remainingTime--;
                counter.textContent = `${remainingTime}s`;
                progressBar.style.width = `${(remainingTime / (watchTime / 1000)) * 100}%`;

                if (remainingTime <= 0) {
                    clearInterval(interval);
                    updateBalance(rewardAmount);

                    const videoBtn = document.getElementById(`video-btn-${currentIndex}`);
                    if (videoBtn) {
                        videoBtn.style.display = "none";
                    }

                    currentIndex++;
                    if (currentIndex < newLinks.length) {
                        playNextVideo();
                    } else {
                        closeVideoContainer();
                    }
                }
            }, 1000);
        }

        function closeVideoContainer() {
            clearInterval(interval);
            if (player) {
                player.destroy();
            }
            videoContainer.remove();
            activeContainers = 0;
        }

        closeButton.onclick = closeVideoContainer;

        videoContainers.appendChild(videoContainer);
        activeContainers = 1;

        if (typeof YT !== "undefined" && typeof YT.Player !== "undefined") {
            createPlayer();
        } else {
            const scriptTag = document.createElement('script');
            scriptTag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(scriptTag);

            window.onYouTubeIframeAPIReady = function () {
                createPlayer();
            };
        }
    }

    function extractVideoId(url) {
        const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[1].length === 11) ? match[1] : null;
    }

    function claimDailyBonus() {
        updateBalance(dailyBonusAmount);
        localStorage.setItem("lastClaimedDate", new Date().toISOString());
        startDailyBonusTimer();
    }

    function startDailyBonusTimer() {
        const dailyBonusButton = document.getElementById("dailyBonusButton");
        if (!dailyBonusButton) return;

        const lastClaimedDate = localStorage.getItem("lastClaimedDate");

        if (lastClaimedDate) {
            const lastClaimedTime = new Date(lastClaimedDate).getTime();
            const currentTime = new Date().getTime();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0); // Set to next midnight
            const timeUntilMidnight = midnight.getTime() - currentTime;

            if (timeUntilMidnight > 0) {
                dailyBonusButton.disabled = true;

                const countdownInterval = setInterval(() => {
                    const remainingTime = midnight.getTime() - new Date().getTime();

                    if (remainingTime <= 0) {
                        clearInterval(countdownInterval);
                        dailyBonusButton.disabled = false;
                        dailyBonusButton.textContent = "Claim Daily Bonus";
                        localStorage.removeItem("lastClaimedDate");
                    } else {
                        const hours = Math.floor(remainingTime / (1000 * 60 * 60));
                        const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
                        dailyBonusButton.textContent = `${hours}h ${minutes}m ${seconds}s`;
                    }
                }, 1000);
            } else {
                dailyBonusButton.disabled = false;
                dailyBonusButton.textContent = "Claim Daily Bonus";
                localStorage.removeItem("lastClaimedDate");
            }
        }
    }

    function createHourlyFaucetButton() {
        const container = document.getElementById('hourly-faucet');
        if (!container) return;

        container.innerHTML = '';

        const hourlyButton = document.createElement('button');
        hourlyButton.textContent = `Claim Hourly Faucet: ${hourlyBonus} PKR`;
        hourlyButton.className = "btn-faucet";

        const lastClaimTime = localStorage.getItem('lastClaimTime');
        const currentTime = Date.now();
        const claimCooldown = 3600000; // 1 hour in milliseconds

        if (lastClaimTime) {
            const timeSinceLastClaim = currentTime - lastClaimTime;
            if (timeSinceLastClaim < claimCooldown) {
                const remainingTime = claimCooldown - timeSinceLastClaim;
                hourlyButton.disabled = true;
                startRemainingTimeCountdown(hourlyButton, remainingTime);
            }
        }

        hourlyButton.onclick = function () {
            updateBalance(hourlyBonus);
            localStorage.setItem('lastClaimTime', Date.now());
            hourlyButton.disabled = true;
            startRemainingTimeCountdown(hourlyButton, claimCooldown);
        };

        container.appendChild(hourlyButton);
    }

    function startRemainingTimeCountdown(button, remainingTime) {
        const countdownInterval = setInterval(() => {
            remainingTime -= 1000;
            const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
            const seconds = Math.floor((remainingTime / 1000) % 60);
            button.textContent = `Next claim in: ${hours}h ${minutes}m ${seconds}s`;

            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                button.textContent = `Claim Hourly Faucet: ${hourlyBonus} PKR`;
                button.disabled = false;
            }
        }, 1000);
    }

    const dailyBonusButton = document.getElementById("dailyBonusButton");
    if (dailyBonusButton) {
        dailyBonusButton.addEventListener("click", claimDailyBonus);
    }

    displayBalance();
    createYouTubeButtons();
    createHourlyFaucetButton();
    startDailyBonusTimer();
});

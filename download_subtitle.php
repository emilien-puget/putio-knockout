<?php
error_reporting(E_ALL);
ini_set('display_errors','On');
use OpenSubtitles\SubtitlesManager;

require 'config/config.php';

$movie_name = $_GET['name'];
$language = $_GET['language'];
$moviehash = $_GET['moviehash'];
$moviesize = $_GET['moviesize'];

$subtitle_manager = New SubtitlesManager('', '', $language, OS_USER_AGENT);

$token = $subtitle_manager->Login();
$response = $subtitle_manager->searchSubtitles($token, $moviehash, $moviesize);

foreach ($response['data'] as $data) {
    if ($data['MovieReleaseName'] != $movie_name) {
        continue;
    }

    die($data['ZipDownloadLink']);
}
if (isset($response['data'][0]['ZipDownloadLink'])) {
    die($response['data'][0]['ZipDownloadLink']);
}
die(false);
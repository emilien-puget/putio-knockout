<?php

use OpenSubtitles\SubtitlesManager;

require 'config/config.php';

$movie_name = $_GET['name'];
$language = $_GET['language'];
$moviehash = $_GET['moviehash'];
$moviesize = $_GET['moviesize'];

$subtitle_manager = New SubtitlesManager('', '', $language, OS_USER_AGENT);

$token = $subtitle_manager->Login();
$response = $subtitle_manager->searchSubtitles($token, $moviehash, $moviesize);


$url = 'http://www.opensubtitles.org/search/sublanguageid-'.$language.'/moviehash-'.$moviehash.'/simplexml';

$result = file_get_contents($url);

$xml = new SimpleXMLElement($result);

$file = (string)$xml[0]->results[0]->subtitle->download;

echo $file;

/*
foreach ($response['data'] as $data) {
    if ($data['MovieReleaseName'] != $movie_name) {
        continue;
    }

    die($data['ZipDownloadLink']);
}
if (isset($response['data'][0]['ZipDownloadLink'])) {
    die($response['data'][0]['ZipDownloadLink']);
}
die(false);*/
import React, { useState } from 'react';
import { API } from 'aws-amplify';
import { Repo } from '../types/Repo';

const PAGE_SIZE = 25;

const useRepositories = () => {
  const [repos, setRepos] = useState(new Map());
  const [savedRepos, setSavedRepos] = useState(new Map());
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isSavingLoading, setIsSavingLoading] = useState(false);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRepos = async (pageSize = PAGE_SIZE) => {
    setIsGithubLoading(true);
    try {
      const response: Repo[] = await API.get(
        'ZetsAPIGatewayAPI',
        `/github/repos?page=${currentPage}&pageSize=${pageSize}`,
        {}
      );
      const newRepos = new Map(response.map((repo: Repo) => [repo.id, repo]));
      setRepos((prevRepos) => new Map([...prevRepos, ...newRepos]));
      setCurrentPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error('Error fetching repos:', error);
    } finally {
      setIsGithubLoading(false);
    }
  };

  const loadSavedRepos = async () => {
    try {
      const response: Repo[] = await API.get('ZetsAPIGatewayAPI', '/user/repos', {});
      const newSavedRepos = new Map(response.map((repo) => [repo.id, repo]));
      setSavedRepos(newSavedRepos);
    } catch (error) {
      console.error('Error loading saved repos:', error);
    }
  };

  const saveSelectedRepos = async (selectedRowKeys: React.Key[]) => {
    const selectedRepos = selectedRowKeys.map((key) => repos.get(key)).filter((repo) => repo);
    setIsSavingLoading(true);
    try {
      await API.post('ZetsAPIGatewayAPI', '/user/repos', {
        body: selectedRepos,
      });
      loadSavedRepos();
    } catch (error) {
      console.error('Error saving selected repos:', error);
    } finally {
      setIsSavingLoading(false);
    }
  };

  const deleteSelectedRepos = async (selectedRowKeys: React.Key[]) => {
    setIsDeletingLoading(true);
    try {
      await API.del('ZetsAPIGatewayAPI', '/user/repos', {
        body: selectedRowKeys,
      });
      loadSavedRepos();
    } catch (error) {
      console.error('Error deleting repos:', error);
    } finally {
      setIsDeletingLoading(false);
    }
  };

  return {
    repos,
    savedRepos,
    isGithubLoading,
    isSavingLoading,
    isDeletingLoading,
    fetchRepos,
    loadSavedRepos,
    saveSelectedRepos,
    deleteSelectedRepos,
  };
};

export default useRepositories;
